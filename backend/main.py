from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from io import BytesIO
import pandas as pd
from datetime import datetime
from db import engine, Base, get_db
from models import BomWos,ParentPartNo,BomWosPartNoDetails,PartNo,MachineType,Machine,FixRunMachine,Bar,TargetDailyIssue,Capacity,NoRunMachine
from models import Ringreceive,PartFlange,PartTo2nd,ProcessCount,PartYield,Turnover,BalanceOrderMidSmall
from models import BalanceOrderMcb,WorkingDate,Wip,ProductionePlan,RequireTurning
from sqlalchemy import func
from services.priority_group import get_priority_group

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.100.124:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/bom_wos/")
async def bom_wos(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    # Summary count
    count_parent_added = 0
    count_parent_existing = 0
    count_bom_added = 0
    count_bom_existing = 0
    count_part_added = 0
    count_part_existing = 0
    count_detail_added = 0
    count_detail_existing = 0
    count_no_run_added = 0

    parent_added_list = []
    bom_added_list = []
    part_added_list = []
    detail_added_list = []

    try:
        parent_part_no_dict = {}

        for _, row in df.iterrows():
            key = (row["part_component_group"], row["parent_part_no"])
            if key not in parent_part_no_dict and row["parent_part_no"]:
                # ตรวจสอบ ParentPartNo
                parent = db.query(ParentPartNo).filter(
                    ParentPartNo.part_component_group == row["part_component_group"],
                    ParentPartNo.parent_part_no == row["parent_part_no"]
                ).first()

                if not parent:
                    parent = ParentPartNo(
                        part_component_group=row["part_component_group"],
                        parent_part_no=row["parent_part_no"]
                    )
                    db.add(parent)
                    db.flush()
                    count_parent_added += 1
                    parent_added_list.append(row["parent_part_no"])
                    print(f"✅ Added ParentPartNo: {key}")

                    # ⭐ Check machine และเพิ่ม NoRunMachine
                    all_machines = db.query(Machine).all()
                    for machine in all_machines:
                        # เช็กก่อนว่ามี combination นี้หรือยัง
                        exists = db.query(NoRunMachine).filter(
                            NoRunMachine.parent_part_no_id == parent.id,
                            NoRunMachine.machine_id == machine.id
                        ).first()

                        if not exists:
                            new_no_run = NoRunMachine(
                                parent_part_no_id=parent.id,
                                machine_id=machine.id
                            )
                            db.add(new_no_run)
                            count_no_run_added += 1

                else:
                    count_parent_existing += 1
                    print(f"⚠️ Found existing ParentPartNo: {key}")

                parent_part_no_dict[key] = parent.id

        db.commit()

        bom_wos_dict = {}

        for _, row in df.iterrows():
            key = (row["wos_no"], row["brg_no_value"])
            bom = db.query(BomWos).filter(BomWos.wos_no == row["wos_no"]).first()

            if not bom:
                bom = BomWos(
                    wos_no=str(row["wos_no"]) if row["wos_no"] else "",
                    brg_no_value=str(row["brg_no_value"]) if row["brg_no_value"] else None,
                )
                db.add(bom)
                db.flush()
                count_bom_added += 1
                bom_added_list.append(row["wos_no"])
                print(f"✅ Added BomWos: {key}")
            else:
                old_brg_no_value = bom.brg_no_value
                new_brg_no_value = str(row["brg_no_value"]) if row["brg_no_value"] else None

                if old_brg_no_value != new_brg_no_value:
                    bom.brg_no_value = new_brg_no_value
                    bom.updated_at = func.now()
                    print(f"♻️ Updated BomWos: {key}")
                else:
                    print(f"⚠️ Found existing BomWos (no changes): {key}")

                count_bom_existing += 1

            bom_wos_dict[key] = bom.id

        db.commit()

        for _, row in df.iterrows():
            parent_key = (row["part_component_group"], row["parent_part_no"])
            parent_id = parent_part_no_dict.get(parent_key)

            if parent_id:
                part = db.query(PartNo).filter(
                    PartNo.part_no_value == row["part_no_value"],
                    PartNo.parent_part_no__id == parent_id
                ).first()

                if not part:
                    part = PartNo(
                        part_no_value=row["part_no_value"],
                        parent_part_no__id=parent_id
                    )
                    db.add(part)
                    db.flush()
                    count_part_added += 1
                    part_added_list.append(row["part_no_value"])
                    print(f"✅ Added PartNo: {row['part_no_value']}")
                else:
                    count_part_existing += 1
                    print(f"⚠️ Found existing PartNo: {row['part_no_value']}")

                bom_key = (row["wos_no"], row["brg_no_value"])
                bom_id = bom_wos_dict.get(bom_key)

                detail = db.query(BomWosPartNoDetails).filter(
                    BomWosPartNoDetails.wos_no_id == bom_id,
                    BomWosPartNoDetails.part_no_id == part.id
                ).first()

                if not detail:
                    qty = int(row["qty"]) if row["qty"] not in [None, ""] else None
                    new_detail = BomWosPartNoDetails(
                        qty=qty,
                        wos_no_id=bom_id,
                        part_no_id=part.id
                    )
                    db.add(new_detail)
                    count_detail_added += 1
                    detail_added_list.append(f"wos:{row['wos_no']} part:{row['part_no_value']}")
                    print(f"✅ Added BomWosPartNoDetails: wos_no_id={bom_id}, part_no_id={part.id}")
                else:
                    count_detail_existing += 1
                    print(f"⚠️ Found existing BomWosPartNoDetails: wos_no_id={bom_id}, part_no_id={part.id}")

        db.commit()
        print("✅ All commit successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "summary": {
            "parent_part_no": {"added": count_parent_added, "existing": count_parent_existing, "list": parent_added_list},
            "bom_wos": {"added": count_bom_added, "existing": count_bom_existing, "list": bom_added_list},
            "part_no": {"added": count_part_added, "existing": count_part_existing, "list": part_added_list},
            "details": {"added": count_detail_added, "existing": count_detail_existing, "list": detail_added_list},
            "no_run_machine_added": count_no_run_added
        },
        "total_rows": len(df)
    }

@app.post("/upload_balance_order_mid_small/")
async def upload_balance_order_mid_small(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_added = 0
    count_updated = 0
    count_not_found_wos = 0

    try:
        # ✅ ดึงค่า max rev จาก db
        max_rev = db.query(func.max(BalanceOrderMidSmall.rev)).scalar()
        rev = 1 if max_rev is None else max_rev + 1

        for i in range(len(df)):
            order_no = df["order_no"].iloc[i]
            due_date_raw = df["due_date"].iloc[i]
            balance_order = int(df["balance_order"].iloc[i]) if df["balance_order"].iloc[i] not in [None, ""] else None
            part_group = df["part_group"].iloc[i]
            wos_no_str = df["wos_no"].iloc[i]

            # หา BomWos
            bom_wos = db.query(BomWos).filter(BomWos.wos_no == wos_no_str).first()
            if not bom_wos:
                count_not_found_wos += 1
                continue

            # แปลง due_date
            if isinstance(due_date_raw, str):
                due_date = datetime.strptime(due_date_raw, "%Y-%m-%d")
            else:
                due_date = due_date_raw

            # หา record เดิม
            existing = db.query(BalanceOrderMidSmall).filter(
                BalanceOrderMidSmall.order_no == order_no,
                BalanceOrderMidSmall.wos_no_id == bom_wos.id,
            ).first()

            if existing:
                updated = False

                if existing.balance_order != balance_order:
                    existing.balance_order = balance_order
                    updated = True

                if existing.part_group != part_group:
                    existing.part_group = part_group
                    updated = True

                if existing.due_date != due_date:
                    existing.due_date = due_date
                    updated = True

                if updated:
                    existing.updated_at = func.now()
                    count_updated += 1

            else:
                new_rec = BalanceOrderMidSmall(
                    order_no=order_no,
                    due_date=due_date,
                    balance_order=balance_order,
                    part_group=part_group,
                    rev=rev,  # ✅ ใช้ rev จากการ query
                    wos_no_id=bom_wos.id
                )
                db.add(new_rec)
                count_added += 1

        db.commit()
        print("✅ Commit BalanceOrderMidSmall successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_not_found_wos": count_not_found_wos,
        "rev_used": rev  # ✅ แจ้ง rev ที่ใช้กลับไป
    }

@app.post("/upload_balance_order_mcb/")
async def upload_balance_order_mcb(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found_parent = 0
    count_not_found_part = 0
    count_added = 0

    try:
        # หา rev ล่าสุด
        max_rev = db.query(func.max(BalanceOrderMcb.rev)).scalar()
        rev = 1 if max_rev is None else max_rev + 1

        for i in range(len(df)):
            part_no_value = df["part_no_value"].iloc[i]
            parent_part_no_str = df["parent_part_no"].iloc[i]
            part_component_group = df["part_component_group"].iloc[i]

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(
                ParentPartNo.parent_part_no == parent_part_no_str,
                ParentPartNo.part_component_group == part_component_group
            ).first()
            if not parent_part:
                count_not_found_parent += 1
                continue

            # หา PartNo
            part = db.query(PartNo).filter(
                PartNo.part_no_value == part_no_value,
                PartNo.parent_part_no__id == parent_part.id
            ).first()
            if not part:
                count_not_found_part += 1
                continue

            # แปลง due_date
            due_date = df["due_date"].iloc[i]
            if isinstance(due_date, str):
                due_date = datetime.strptime(due_date, "%Y-%m-%d")

            balance_order_value = df["balance_order"].iloc[i]
            if pd.notna(balance_order_value):
                balance_order_value = int(balance_order_value)
            else:
                balance_order_value = None

            new_balance = BalanceOrderMcb(
                order_no=str(df["order_no"].iloc[i]) if pd.notna(df["order_no"].iloc[i]) else None,
                due_date=due_date,
                balance_order=balance_order_value,
                part_group=str(df["part_group"].iloc[i]) if pd.notna(df["part_group"].iloc[i]) else None,
                rev=int(rev),
                part_no__id=int(part.id)
            )
            db.add(new_balance)
            count_added += 1

        db.commit()
        print("✅ Commit BalanceOrderMcb successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_not_found_parent": count_not_found_parent,
        "rows_not_found_part": count_not_found_part
    }

@app.post("/upload_machine/")
async def upload_machine(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_added = 0
    count_updated = 0
    count_no_run_added = 0

    try:
        for i in range(len(df)):
            machine_type_name = df["machine_type"].iloc[i]

            # หา MachineType ถ้าไม่มีให้สร้างใหม่
            machine_type = db.query(MachineType).filter(MachineType.machine_type == machine_type_name).first()
            if not machine_type:
                machine_type = MachineType(machine_type=machine_type_name)
                db.add(machine_type)
                db.flush()  # เพื่อให้ได้ id

            # อ่านค่า can_use
            can_use_value = df["can_use"].iloc[i]
            if isinstance(can_use_value, str):
                can_use_value = can_use_value.strip().lower() == "true"
            elif pd.isna(can_use_value):
                can_use_value = True
            else:
                can_use_value = bool(can_use_value)

            # ตรวจสอบ machine_no
            existing_machine = db.query(Machine).filter(Machine.machine_no == df["machine_no"].iloc[i]).first()

            if existing_machine:
                if existing_machine.can_use != can_use_value:
                    existing_machine.can_use = can_use_value
                    existing_machine.updated_at = datetime.now()
                    db.add(existing_machine)
                    count_updated += 1
            else:
                new_machine = Machine(
                    machine_no=df["machine_no"].iloc[i],
                    machine_name=df["machine_name"].iloc[i],
                    kpi_group_machine=df["kpi_group_machine"].iloc[i],
                    can_use=can_use_value,
                    machine_type_id=machine_type.id
                )
                # print(f"✅")
                db.add(new_machine)
                db.flush()  # ⭐ ได้ new_machine.id
                count_added += 1

                # 🔥 เพิ่มใน NoRunMachine
                all_parents = db.query(ParentPartNo).all()
                # print(f"✅1")
                for parent in all_parents:
                    exists = db.query(NoRunMachine).filter(
                        NoRunMachine.parent_part_no_id == parent.id,
                        NoRunMachine.machine_id == new_machine.id
                    ).first()

                    if not exists:
                        new_no_run = NoRunMachine(
                            parent_part_no_id=parent.id,
                            machine_id=new_machine.id
                        )
                        # print(f"✅")
                        db.add(new_no_run)
                        count_no_run_added += 1

        db.commit()
        print(f"✅ Commit Machine & MachineType & NoRunMachine successful")
        print(f"✅ Added machines: {count_added}")
        print(f"✅ Updated machines: {count_updated}")
        print(f"✅ Added NoRunMachine records: {count_no_run_added}")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "no_run_machine_added": count_no_run_added
    }

@app.post("/upload_fix_run_machine/")
async def upload_fix_run_machine(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found = 0
    count_added = 0
    count_duplicate = 0

    try:
        for i in range(len(df)):
            parent_part_no_str = df["parent_part_no"].iloc[i]
            machine_no_str = df["machine_no"].iloc[i]

            # หา parent_part_no
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found += 1
                continue

            # หา machine
            machine = db.query(Machine).filter(Machine.machine_no == machine_no_str).first()
            if not machine:
                count_not_found += 1
                continue

            # ✅ ตรวจสอบว่ามีข้อมูลซ้ำใน FixRunMachine หรือยัง
            exists = (
                db.query(FixRunMachine)
                .filter(
                    FixRunMachine.parent_part_no_id == parent_part.id,
                    FixRunMachine.machine_id == machine.id
                )
                .first()
            )
            if exists:
                count_duplicate += 1
                continue

            # ถ้าไม่ซ้ำ → เพิ่มใหม่
            new_fix_run = FixRunMachine(
                parent_part_no_id=parent_part.id,
                machine_id=machine.id,
            )
            db.add(new_fix_run)
            count_added += 1

        db.commit()
        print("✅ Commit FixRunMachine successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_not_found": count_not_found,
        "rows_duplicate": count_duplicate
    }

@app.post("/upload_bar/")
async def upload_bar(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found = 0
    count_added = 0
    count_updated = 0
    updated_rows = []

    try:
        for i in range(len(df)):
            row = df.iloc[i]
            parent_part_no_str = row["parent_part_no"]

            # หา parent_part_no
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found += 1
                continue

            # แปลงค่า numeric
            od = float(row["od"])
            _id = float(row["_id"])
            width = float(row["width"])
            bar_lenght = float(row["bar_lenght"])

            # ตรวจสอบซ้ำ
            existing_bar = (
                db.query(Bar)
                .filter(
                    Bar.parent_part_no_id == parent_part.id,
                    Bar.material == row["material"],
                    Bar.od == od,
                    Bar._id == _id,
                    Bar.width == width,
                    Bar.bar_lenght == bar_lenght
                )
                .first()
            )

            if existing_bar:
                # บันทึกข้อมูลก่อนอัปเดต
                log_data = {
                    "id": existing_bar.id,
                    "parent_part_no": parent_part_no_str,
                    "material": existing_bar.material,
                    "od": existing_bar.od,
                    "_id": existing_bar._id,
                    "width": existing_bar.width,
                    "bar_lenght": existing_bar.bar_lenght,
                    "old_qty_bar": existing_bar.qty_bar,
                    "old_bar_weight": existing_bar.bar_weight,
                }

                # อัปเดตข้อมูล
                existing_bar.facing = float(row["facing"])
                existing_bar.cut_off_1 = float(row["cut_off_1"])
                existing_bar.cut_off_2 = float(row["cut_off_2"])
                existing_bar.bar_end = float(row["bar_end"])
                existing_bar.qty_bar = float(row["qty_bar"])
                existing_bar.bar_weight = float(row["bar_weight"])
                existing_bar.updated_at = func.now()

                # เพิ่มข้อมูลใหม่หลังอัปเดตลง log
                log_data.update({
                    "new_qty_bar": existing_bar.qty_bar,
                    "new_bar_weight": existing_bar.bar_weight,
                })
                updated_rows.append(log_data)

                count_updated += 1
            else:
                # เพิ่มใหม่
                new_bar = Bar(
                    material=row["material"],
                    od=od,
                    _id=_id,
                    width=width,
                    facing=float(row["facing"]),
                    cut_off_1=float(row["cut_off_1"]),
                    cut_off_2=float(row["cut_off_2"]),
                    bar_end=float(row["bar_end"]),
                    bar_lenght=bar_lenght,
                    qty_bar=float(row["qty_bar"]),
                    bar_weight=float(row["bar_weight"]),
                    parent_part_no_id=parent_part.id
                )
                db.add(new_bar)
                count_added += 1

        db.commit()
        print("✅ Commit Bar successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_not_found_parent": count_not_found,
        "updated_details": updated_rows
    }

@app.post("/upload_target_daily_issue/")
async def upload_target_daily_issue(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found = 0
    count_added = 0
    count_updated = 0
    updated_rows = []

    try:
        for i in range(len(df)):
            parent_part_no_str = df["parent_part_no"].iloc[i]
            month = int(df["month"].iloc[i]) if not pd.isna(df["month"].iloc[i]) else None
            year = int(df["year"].iloc[i]) if not pd.isna(df["year"].iloc[i]) else None
            target_daily_issue_value = int(df["target_daily_issue"].iloc[i]) if not pd.isna(df["target_daily_issue"].iloc[i]) else None

            # หา parent_part_no
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found += 1
                continue

            # ตรวจสอบ record เดิม
            existing = (
                db.query(TargetDailyIssue)
                .filter(
                    TargetDailyIssue.parent_part_no_id == parent_part.id,
                    TargetDailyIssue.month == month,
                    TargetDailyIssue.year == year
                )
                .first()
            )

            if existing:
                if existing.target_daily_issue != target_daily_issue_value:
                    updated_rows.append({
                        "parent_part_no": parent_part_no_str,
                        "month": month,
                        "year": year,
                        "old_target": existing.target_daily_issue,
                        "new_target": target_daily_issue_value
                    })
                    existing.target_daily_issue = target_daily_issue_value
                    existing.updated_at = func.now()
                    count_updated += 1
            else:
                # Add ใหม่
                new_target = TargetDailyIssue(
                    target_daily_issue=target_daily_issue_value,
                    month=month,
                    year=year,
                    parent_part_no_id=parent_part.id,
                )
                db.add(new_target)
                count_added += 1

        db.commit()
        print("✅ Commit TargetDailyIssue successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_not_found_parent": count_not_found,
        "updated_details": updated_rows
    }

@app.post("/upload_capacity/")
async def upload_capacity(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found_parent = 0
    count_not_found_machine = 0
    count_added = 0
    count_updated = 0
    updated_rows = []

    try:
        for i in range(len(df)):
            parent_part_no_str = df["parent_part_no"].iloc[i]
            machine_type_str = df["machine_type"].iloc[i]

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found_parent += 1
                continue

            # หา MachineType
            machine_type = db.query(MachineType).filter(MachineType.machine_type == machine_type_str).first()
            if not machine_type:
                count_not_found_machine += 1
                continue

            # ตรวจสอบ Capacity เดิม
            existing = (
                db.query(Capacity)
                .filter(
                    Capacity.parent_part_no_id == parent_part.id,
                    Capacity.machine_type_id == machine_type.id,
                    Capacity.bite_life == str(df["bite_life"].iloc[i]) if df["bite_life"].iloc[i] else None,
                    Capacity.pos_type == str(df["pos_type"].iloc[i]) if df["pos_type"].iloc[i] else None,
                )
                .first()
            )

            # ข้อมูลใหม่
            ring_output = int(df["ring_output"].iloc[i]) if df["ring_output"].iloc[i] else None
            cycle_time = float(df["cycle_time"].iloc[i]) if df["cycle_time"].iloc[i] else None
            utl = float(df["utl"].iloc[i]) if df["utl"].iloc[i] else None
            group_pos_type = str(df["group_pos_type"].iloc[i]) if df["group_pos_type"].iloc[i] else None
            capa_day = int(df["capa_day"].iloc[i]) if df["capa_day"].iloc[i] else None

            if existing:
                # อัปเดตเฉพาะถ้าข้อมูลใหม่ไม่ตรง
                updated = False

                if existing.capa_day != capa_day:
                    existing.capa_day = capa_day
                    updated = True

                if existing.ring_output != ring_output:
                    existing.ring_output = ring_output
                    updated = True

                if existing.cycle_time != cycle_time:
                    existing.cycle_time = cycle_time
                    updated = True

                if existing.utl != utl:
                    existing.utl = utl
                    updated = True

                if existing.group_pos_type != group_pos_type:
                    existing.group_pos_type = group_pos_type
                    updated = True

                if updated:
                    existing.updated_at = func.now()
                    updated_rows.append({
                        "parent_part_no": parent_part_no_str,
                        "machine_type": machine_type_str,
                        "bite_life": existing.bite_life,
                        "pos_type": existing.pos_type
                    })
                    count_updated += 1

            else:
                # Insert ใหม่
                new_capacity = Capacity(
                    ring_output=ring_output,
                    cycle_time=cycle_time,
                    utl=utl,
                    bite_life=str(df["bite_life"].iloc[i]) if df["bite_life"].iloc[i] else None,
                    pos_type=str(df["pos_type"].iloc[i]) if df["pos_type"].iloc[i] else None,
                    group_pos_type=group_pos_type,
                    capa_day=capa_day,
                    parent_part_no_id=parent_part.id,
                    machine_type_id=machine_type.id,
                )
                db.add(new_capacity)
                count_added += 1

        db.commit()
        print("✅ Commit Capacity successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_not_found_parent_part_no": count_not_found_parent,
        "rows_not_found_machine_type": count_not_found_machine,
        "updated_details": updated_rows
    }

@app.post("/upload_ring_receive/")
async def upload_ring_receive(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์ CSV หรือ Excel
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found_part_no = 0
    count_not_found_parent = 0
    count_added = 0
    count_duplicate = 0

    try:
        for i in range(len(df)):
            part_no_value = df["part_no_value"].iloc[i]
            parent_part_no_str = df["parent_part_no"].iloc[i]

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found_parent += 1
                continue

            # หา PartNo
            part_no = db.query(PartNo).filter(
                PartNo.part_no_value == part_no_value,
                PartNo.parent_part_no__id == parent_part.id
            ).first()
            if not part_no:
                count_not_found_part_no += 1
                continue

            # ตรวจสอบว่ามี ring_receive ซ้ำหรือยัง
            existing = db.query(Ringreceive).filter(
                Ringreceive.part_no__id == part_no.id
            ).first()

            if existing:
                count_duplicate += 1
                continue

            # เพิ่มใหม่
            new_ring_receive = Ringreceive(
                part_no__id=part_no.id
            )
            db.add(new_ring_receive)
            count_added += 1

        db.commit()
        print("✅ Commit Ringreceive successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_not_found_part_no": count_not_found_part_no,
        "rows_not_found_parent_part_no": count_not_found_parent,
        "rows_duplicate": count_duplicate,
    }

@app.post("/upload_part_flange/")
async def upload_part_flange(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์ csv หรือ excel
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found_parent = 0
    count_not_found_part = 0
    count_added = 0
    count_duplicate = 0

    try:
        for i in range(len(df)):
            parent_part_no_str = df["parent_part_no"].iloc[i]
            part_no_value_str = df["part_no_value"].iloc[i]

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found_parent += 1
                continue

            # หา PartNo
            part_no = (
                db.query(PartNo)
                .filter(PartNo.part_no_value == part_no_value_str, PartNo.parent_part_no__id == parent_part.id)
                .first()
            )
            if not part_no:
                count_not_found_part += 1
                continue

            # ตรวจสอบซ้ำ
            exists = db.query(PartFlange).filter(PartFlange.part_no__id == part_no.id).first()
            if exists:
                count_duplicate += 1
                continue

            # เพิ่มใหม่
            new_flange = PartFlange(part_no__id=part_no.id)
            db.add(new_flange)
            count_added += 1

        db.commit()
        print("✅ Commit PartFlange successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_duplicate": count_duplicate,
        "rows_not_found_parent_part_no": count_not_found_parent,
        "rows_not_found_part_no": count_not_found_part
    }

@app.post("/upload_part_to_2nd/")
async def upload_part_to_2nd(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์ csv หรือ excel
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found_parent = 0
    count_not_found_part = 0
    count_added = 0
    count_duplicate = 0

    try:
        for i in range(len(df)):
            parent_part_no_str = df["parent_part_no"].iloc[i]
            part_no_value_str = df["part_no_value"].iloc[i]

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found_parent += 1
                continue

            # หา PartNo
            part_no = (
                db.query(PartNo)
                .filter(PartNo.part_no_value == part_no_value_str, PartNo.parent_part_no__id == parent_part.id)
                .first()
            )
            if not part_no:
                count_not_found_part += 1
                continue

            # ตรวจสอบซ้ำ
            exists = db.query(PartTo2nd).filter(PartTo2nd.part_no__id == part_no.id).first()
            if exists:
                count_duplicate += 1
                continue

            # เพิ่มใหม่
            new_part_to_2nd = PartTo2nd(part_no__id=part_no.id)
            db.add(new_part_to_2nd)
            count_added += 1

        db.commit()
        print("✅ Commit PartTo2nd successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_duplicate": count_duplicate,
        "rows_not_found_parent_part_no": count_not_found_parent,
        "rows_not_found_part_no": count_not_found_part
    }

@app.post("/upload_process_count/")
async def upload_process_count(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์ csv หรือ excel
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found_parent = 0
    count_not_found_part = 0
    count_added = 0
    count_updated = 0

    try:
        for i in range(len(df)):
            parent_part_no_str = df["parent_part_no"].iloc[i]
            part_no_value_str = df["part_no_value"].iloc[i]
            process_count_value = int(df["process_count"].iloc[i]) if not pd.isna(df["process_count"].iloc[i]) else None

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found_parent += 1
                continue

            # หา PartNo
            part_no = (
                db.query(PartNo)
                .filter(PartNo.part_no_value == part_no_value_str, PartNo.parent_part_no__id == parent_part.id)
                .first()
            )
            if not part_no:
                count_not_found_part += 1
                continue

            # ตรวจสอบว่ามี record เดิมมั้ย
            existing = db.query(ProcessCount).filter(ProcessCount.id == part_no.id).first()

            if existing:
                # อัปเดต process_count ถ้าไม่เท่ากัน
                if existing.process_count != process_count_value:
                    existing.process_count = process_count_value
                    existing.updated_at = func.now()
                    count_updated += 1
            else:
                # เพิ่มใหม่
                new_process_count = ProcessCount(
                    id=part_no.id,  # ใช้ id ของ PartNo เป็น id ของ ProcessCount
                    process_count=process_count_value
                )
                db.add(new_process_count)
                count_added += 1

        db.commit()
        print("✅ Commit ProcessCount successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_not_found_parent_part_no": count_not_found_parent,
        "rows_not_found_part_no": count_not_found_part
    }

@app.post("/upload_part_yield/")
async def upload_part_yield(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found_parent = 0
    count_not_found_part = 0
    count_added = 0
    count_updated = 0

    try:
        for i in range(len(df)):
            parent_part_no_str = df["parent_part_no"].iloc[i]
            part_no_value_str = df["part_no_value"].iloc[i]
            yield_value = float(df["yield"].iloc[i]) if df["yield"].iloc[i] else None

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found_parent += 1
                continue

            # หา PartNo
            part_no = db.query(PartNo).filter(
                PartNo.part_no_value == part_no_value_str,
                PartNo.parent_part_no__id == parent_part.id
            ).first()

            if not part_no:
                count_not_found_part += 1
                continue

            # ตรวจสอบ PartYield เดิม
            existing = db.query(PartYield).filter(
                PartYield.part_no__id == part_no.id
            ).first()

            if existing:
                if existing.yield_value != yield_value:
                    existing.yield_value = yield_value
                    existing.updated_at = func.now()
                    count_updated += 1
            else:
                new_yield = PartYield(
                    yield_value=yield_value,
                    part_no__id=part_no.id,
                )
                db.add(new_yield)
                count_added += 1

        db.commit()
        print("✅ Commit PartYield successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_not_found_parent": count_not_found_parent,
        "rows_not_found_part_no": count_not_found_part,
    }

@app.post("/upload_turnover/")
async def upload_turnover(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_not_found = 0
    count_added = 0
    count_updated = 0

    try:
        for i in range(len(df)):
            part_no_value = df["part_no_value"].iloc[i]
            parent_part_no_str = df["parent_part_no"].iloc[i]

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no_str).first()
            if not parent_part:
                count_not_found += 1
                continue

            # หา PartNo
            part_no = db.query(PartNo).filter(
                PartNo.part_no_value == part_no_value,
                PartNo.parent_part_no__id == parent_part.id
            ).first()
            if not part_no:
                count_not_found += 1
                continue

            # ตรวจสอบว่ามี Turnover เดิมไหม
            existing = db.query(Turnover).filter(Turnover.part_no_id == part_no.id).first()

            # เตรียมข้อมูลใหม่
            turnover_data = {
                "tn": float(df["tn"].iloc[i]) if pd.notna(df["tn"].iloc[i]) else None,
                "rsl_rod": float(df["rsl_rod"].iloc[i]) if pd.notna(df["rsl_rod"].iloc[i]) else None,
                "_2nd": float(df["_2nd"].iloc[i]) if pd.notna(df["_2nd"].iloc[i]) else None,
                "ht": float(df["ht"].iloc[i]) if pd.notna(df["ht"].iloc[i]) else None,
                "sl": float(df["sl"].iloc[i]) if pd.notna(df["sl"].iloc[i]) else None,
                "barrel_bf_od": float(df["barrel_bf_od"].iloc[i]) if pd.notna(df["barrel_bf_od"].iloc[i]) else None,
                "od": float(df["od"].iloc[i]) if pd.notna(df["od"].iloc[i]) else None,
                "od_sf": float(df["od_sf"].iloc[i]) if pd.notna(df["od_sf"].iloc[i]) else None,
                "_45m": float(df["_45m"].iloc[i]) if pd.notna(df["_45m"].iloc[i]) else None,
                "bg": float(df["bg"].iloc[i]) if pd.notna(df["bg"].iloc[i]) else None,
                "bs": float(df["bs"].iloc[i]) if pd.notna(df["bs"].iloc[i]) else None,
                "barrel_bf_race": float(df["barrel_bf_race"].iloc[i]) if pd.notna(df["barrel_bf_race"].iloc[i]) else None,
                "race": float(df["race"].iloc[i]) if pd.notna(df["race"].iloc[i]) else None,
                "barrel_bf_sf": float(df["barrel_bf_sf"].iloc[i]) if pd.notna(df["barrel_bf_sf"].iloc[i]) else None,
                "sf": float(df["sf"].iloc[i]) if pd.notna(df["sf"].iloc[i]) else None,
                "mold_od2": float(df["mold_od2"].iloc[i]) if pd.notna(df["mold_od2"].iloc[i]) else None,
                "ws": float(df["ws"].iloc[i]) if pd.notna(df["ws"].iloc[i]) else None,
                "_14a1": float(df["_14a1"].iloc[i]) if pd.notna(df["_14a1"].iloc[i]) else None,
                "turnover_turning": float(df["turnover_turning"].iloc[i]) if pd.notna(df["turnover_turning"].iloc[i]) else None,
                "max_turnover": float(df["max_turnover"].iloc[i]) if pd.notna(df["max_turnover"].iloc[i]) else None,
                "min_turnover": float(df["min_turnover"].iloc[i]) if pd.notna(df["min_turnover"].iloc[i]) else None,
            }
            if existing:
                # อัปเดตถ้าข้อมูลเปลี่ยน
                for field, value in turnover_data.items():
                    if getattr(existing, field) != value:
                        setattr(existing, field, value)
                        existing.updated_at = func.now()
                count_updated += 1
            else:
                new_turnover = Turnover(
                    part_no_id=part_no.id,
                    **turnover_data
                )
                db.add(new_turnover)
                count_added += 1

        db.commit()
        print("✅ Commit Turnover successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_total": len(df),
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_not_found": count_not_found,
    }

@app.post("/upload_working_date/")
async def upload_working_date(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # อ่านไฟล์ CSV หรือ Excel
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_added = 0
    count_updated = 0

    try:
        for i in range(len(df)):
            # แปลงค่า date
            date_value = df["working_date"].iloc[i]
            if isinstance(date_value, str):
                working_date = datetime.strptime(date_value, "%Y-%m-%d")
            elif isinstance(date_value, datetime):
                working_date = date_value
            else:
                raise HTTPException(status_code=400, detail=f"Invalid date format at row {i+1}")

            working_hr = float(df["working_hr"].iloc[i]) if df["working_hr"].iloc[i] is not None else None

            # หา record เดิม
            existing = db.query(WorkingDate).filter(WorkingDate.working_date == working_date).first()

            if existing:
                if existing.working_hr != working_hr:
                    existing.working_hr = working_hr
                    existing.updated_at = func.now()
                    count_updated += 1
            else:
                new_record = WorkingDate(
                    working_date=working_date,
                    working_hr=working_hr
                )
                db.add(new_record)
                count_added += 1

        db.commit()
        print("✅ Commit WorkingDate successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "rows_added": count_added,
        "rows_updated": count_updated,
        "rows_total": len(df)
    }

@app.post("/upload_wip/")
async def upload_wip(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail="File type not supported. Please upload .csv or .xlsx")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    df = df.where(pd.notnull(df), None)

    count_skip_parent = 0
    count_create_part = 0
    count_add_wip = 0

    try:
        for i in range(len(df)):
            part_no_value = str(df["part_no_value"].iloc[i]).strip() if df["part_no_value"].iloc[i] else None
            parent_part_no_value = str(df["parent_part_no"].iloc[i]).strip() if df["parent_part_no"].iloc[i] else None

            # หา ParentPartNo
            parent_part = db.query(ParentPartNo).filter(
                ParentPartNo.parent_part_no == parent_part_no_value
            ).first()

            if not parent_part:
                count_skip_parent += 1
                continue  # ⬅️ ข้าม row นี้

            # หา PartNo
            part = db.query(PartNo).filter(
                PartNo.part_no_value == part_no_value,
                PartNo.parent_part_no__id == parent_part.id
            ).first()

            if not part:
                # ถ้าไม่เจอ → สร้างใหม่
                part = PartNo(
                    part_no_value=part_no_value,
                    parent_part_no__id=parent_part.id
                )
                db.add(part)
                db.flush()  # เพื่อให้ได้ part.id
                count_create_part += 1

            # หา rev ล่าสุด
            max_rev = db.query(Wip).filter(Wip.part_no_id == part.id).order_by(Wip.rev.desc()).first()
            next_rev = (max_rev.rev + 1) if max_rev and max_rev.rev is not None else 1

            new_wip = Wip(
                process_value=str(df["process_value"].iloc[i]) if df["process_value"].iloc[i] else None,
                qty=int(df["qty"].iloc[i]) if df["qty"].iloc[i] not in [None, ""] else None,
                wip_type=str(df["wip_type"].iloc[i]) if df["wip_type"].iloc[i] else None,
                rev=next_rev,
                part_no_id=part.id,
                updated_at=datetime.now()
            )

            db.add(new_wip)
            count_add_wip += 1

        db.commit()
        print("✅ Commit Wip successful")

    except Exception as e:
        db.rollback()
        print("❌ Rollback due to error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "filename": file.filename,
        "status": "success",
        "total_rows": len(df),
        "skipped_parent_part_no": count_skip_parent,
        "created_part_no": count_create_part,
        "added_wip_rows": count_add_wip
    }

@app.get("/check-parent-data/")
async def check_parent_data(parent_part_no: str = Query(...), db: Session = Depends(get_db)):
    # หา ParentPartNo
    parent = db.query(ParentPartNo).filter(ParentPartNo.parent_part_no == parent_part_no).first()
    if not parent:
        raise HTTPException(status_code=404, detail=f"ParentPartNo '{parent_part_no}' not found.")

    # PartNo ที่เกี่ยวข้อง
    part_nos = db.query(PartNo).filter(PartNo.parent_part_no__id == parent.id).all()
    part_no_ids = [p.id for p in part_nos]
    part_no_values = [p.part_no_value for p in part_nos]

    # ตารางอื่น ๆ ที่เกี่ยวข้องกับ PartNo
    wip_count = db.query(Wip).filter(Wip.part_no_id.in_(part_no_ids)).count()
    ring_receive_count = db.query(Ringreceive).filter(Ringreceive.part_no__id.in_(part_no_ids)).count()
    flange_count = db.query(PartFlange).filter(PartFlange.part_no__id.in_(part_no_ids)).count()
    to2nd_count = db.query(PartTo2nd).filter(PartTo2nd.part_no__id.in_(part_no_ids)).count()
    yield_count = db.query(PartYield).filter(PartYield.part_no__id.in_(part_no_ids)).count()
    turnover_count = db.query(Turnover).filter(Turnover.part_no_id.in_(part_no_ids)).count()
    balance_mcb_count = db.query(BalanceOrderMcb).filter(BalanceOrderMcb.part_no__id.in_(part_no_ids)).count()

    # ตารางอื่น ๆ ที่ใช้ parent_part_no โดยตรง
    bar_count = db.query(Bar).filter(Bar.parent_part_no_id == parent.id).count()
    target_daily_count = db.query(TargetDailyIssue).filter(TargetDailyIssue.parent_part_no_id == parent.id).count()
    capacity_count = db.query(Capacity).filter(Capacity.parent_part_no_id == parent.id).count()
    fix_run_machine_count = db.query(FixRunMachine).filter(FixRunMachine.parent_part_no_id == parent.id).count()
    no_run_machine_count = db.query(NoRunMachine).filter(NoRunMachine.parent_part_no_id == parent.id).count()
    production_plan_count = db.query(ProductionePlan).filter(ProductionePlan.parent_part_no_id == parent.id).count()
    require_turning_count = db.query(RequireTurning).filter(RequireTurning.parent_part_no_id == parent.id).count()
    balance_mid_small_count = db.query(BalanceOrderMidSmall).filter(BalanceOrderMidSmall.wos_no_id.in_(
        db.query(BomWos.id).filter(BomWosPartNoDetails.part_no_id.in_(part_no_ids))
    )).count()

    # สรุปทั้งหมด
    return {
        "parent_part_no": parent_part_no,
        "parent_part_no_status": "✅ พบ ParentPartNo",
        "total_part_no_count": len(part_nos),
        "part_no_values": part_no_values,
        "related_tables": {
            "wip": wip_count,
            "ring_receive": ring_receive_count,
            "part_flange": flange_count,
            "part_to_2nd": to2nd_count,
            "part_yield": yield_count,
            "turnover": turnover_count,
            "balance_order_mcb": balance_mcb_count,
            "bar": bar_count,
            "target_daily_issue": target_daily_count,
            "capacity": capacity_count,
            "fix_run_machine": fix_run_machine_count,
            "no_run_machine": no_run_machine_count,
            "production_plan": production_plan_count,
            "require_turning": require_turning_count,
            "balance_order_mid_small": balance_mid_small_count,
        },
        "alert": "⚠️ พบข้อมูลที่เกี่ยวข้องในหลายตาราง!" if (
            wip_count or ring_receive_count or flange_count or to2nd_count or
            yield_count or turnover_count or balance_mcb_count or bar_count or
            target_daily_count or capacity_count or fix_run_machine_count or
            no_run_machine_count or production_plan_count or require_turning_count or
            balance_mid_small_count
        ) else "✅ ไม่มีข้อมูลที่เกี่ยวข้อง สามารถลบได้อย่างปลอดภัย"
    }

@app.post("/generate-require-turning/")
def generate_require_turning(db: Session = Depends(get_db)):
    from services.priority_group import get_priority_group

    # 👉 query parent_part_no ทั้งหมด
    parents = db.query(ParentPartNo).all()

    results = []

    for parent in parents:
        # 👉 query part_no ของ parent
        parts = db.query(PartNo).filter(PartNo.parent_part_no__id == parent.id).all()

        for part in parts:
            # 👉 เช็คใน BalanceOrderMidSmall
            mid = db.query(BalanceOrderMidSmall).filter(BalanceOrderMidSmall.wos_no_id == part.id).first()

            # 👉 เช็คใน BalanceOrderMcb
            mcb = db.query(BalanceOrderMcb).filter(BalanceOrderMcb.part_no__id == part.id).first()

            # ✅ ถ้าไม่มี balance order ในทั้งสองตาราง ให้ข้าม
            if not mid and not mcb:
                continue

            # 👉 เลือกข้อมูลจาก mid หรือ mcb
            if mid:
                order_no = mid.order_no
                due_date = mid.due_date
                balance_order_value = mid.balance_order
                part_group = mid.part_group
                source = "mid_small"
                order_no_id = mid.id
            else:
                order_no = mcb.order_no
                due_date = mcb.due_date
                balance_order_value = mcb.balance_order
                part_group = mcb.part_group
                source = "mcb"
                order_no_id = mcb.id

            # 👉 ดึง WIP ล่าสุด
            wip = db.query(Wip).filter(Wip.part_no_id == part.id).order_by(Wip.rev.desc()).first()
            wip_qty = wip.qty if wip else 0

            # 👉 ดึง target daily issue
            target = db.query(TargetDailyIssue).filter(TargetDailyIssue.parent_part_no_id == parent.id).first()
            target_daily = target.target_daily_issue if target else 0

            # 👉 คำนวณ priority group
            priority_group = get_priority_group(due_date)

            # 👉 สร้างหรืออัปเดต RequireTurning
            existing = (
                db.query(RequireTurning)
                .filter(RequireTurning.part_no_id == part.id)
                .first()
            )

            if existing:
                # อัปเดตค่า
                existing.due_date = due_date
                existing.part_group = part_group
                existing.require_turning = balance_order_value
                existing.priority_group = priority_group
                existing.turnover_parent = None  # หากต้องการเพิ่ม turnover จริง ค่อยเติม
                existing.wip_parent = wip_qty
                existing.target_daily_issue = target_daily
                existing.order_no_id = order_no_id
                existing.order_no_source = source
                existing.parent_part_no_id = parent.id
            else:
                # เพิ่มใหม่
                new_rec = RequireTurning(
                    due_date=due_date,
                    part_group=part_group,
                    require_turning=balance_order_value,
                    priority_group=priority_group,
                    turnover_parent=None,
                    wip_parent=wip_qty,
                    target_daily_issue=target_daily,
                    order_no_id=order_no_id,
                    order_no_source=source,
                    part_no_id=part.id,
                    parent_part_no_id=parent.id,
                )
                db.add(new_rec)

            # เก็บผลลัพธ์ส่งกลับ frontend
            results.append({
                "parent_part_no": parent.parent_part_no,
                "part_no_value": part.part_no_value,
                "order_no": order_no,
                "due_date": due_date,
                "balance_order": balance_order_value,
                "part_group": part_group,
                "source": source,
                "wip_qty": wip_qty,
                "target_daily_issue": target_daily,
                "priority_group": priority_group
            })

    db.commit()

    return results








