from sqlalchemy import Integer, String, ForeignKey,Float,Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import datetime
from db import Base
from typing import Optional

class BomWos(Base):
    __tablename__ = "bom_wos" 
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    wos_no: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    brg_no_value: Mapped[str] = mapped_column(String(100), nullable=True)

class BomWosPartNoDetails(Base):
    __tablename__ = "bom_wos_part_no_details" 
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=True)
    wos_no_id: Mapped[int] = mapped_column(ForeignKey("bom_wos.id", ondelete="CASCADE"))
    part_no_id: Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))
    
class ParentPartNo(Base):
    __tablename__ = "parent_part_no"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    part_component_group: Mapped[str] = mapped_column(String(100), nullable=True)
    parent_part_no: Mapped[str] = mapped_column(String(100), nullable=True, index=True)

class PartNo(Base):
    __tablename__ = "part_no"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    part_no_value: Mapped[str] = mapped_column(String(100), nullable=True)
    parent_part_no__id: Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"))

class BalanceOrderMidSmall(Base):
    __tablename__= "balance_order_mid_small"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    order_no : Mapped[str] = mapped_column(String(100), nullable=True)
    due_date : Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    balance_order : Mapped[int] = mapped_column(Integer, nullable=True)
    part_group : Mapped[str] = mapped_column(String(100), nullable=True)
    rev : Mapped[int] = mapped_column(Integer, nullable=True)
    wos_no_id : Mapped[int] = mapped_column(ForeignKey("bom_wos.id", ondelete="CASCADE"))

class BalanceOrderMcb(Base):
    __tablename__= "balance_order_mcb"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    order_no : Mapped[str] = mapped_column(String(100), nullable=True)
    due_date : Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    balance_order : Mapped[int] = mapped_column(Integer, nullable=True)
    part_group : Mapped[str] = mapped_column(String(100), nullable=True)
    rev : Mapped[int] = mapped_column(Integer, nullable=True)
    part_no__id: Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))

class MachineType(Base):
    __tablename__= "machine_type"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    machine_type : Mapped[str] = mapped_column(String(100), nullable=True)

class Machine(Base):
    __tablename__= "machine"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    machine_no : Mapped[str] = mapped_column(String(100), nullable=True)
    machine_name : Mapped[str] = mapped_column(String(100), nullable=True)
    kpi_group_machine : Mapped[str] = mapped_column(String(100), nullable=True)
    can_use : Mapped[bool] = mapped_column(default=True)
    history_parent_part: Mapped[Optional[str]] = mapped_column(default=None, nullable=True)
    last_working_date: Mapped[Optional[datetime.datetime]] = mapped_column(default=None, nullable=True)

    machine_type_id : Mapped[int] = mapped_column(ForeignKey("machine_type.id", ondelete="CASCADE"))

class FixRunMachine(Base):
    __tablename__= "fix_run_machine"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    parent_part_no_id: Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"))
    machine_id: Mapped[int] = mapped_column(ForeignKey("machine.id", ondelete="CASCADE"))

class NoRunMachine(Base):
    __tablename__= "no_run_machine"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    parent_part_no_id: Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"))
    machine_id: Mapped[int] = mapped_column(ForeignKey("machine.id", ondelete="CASCADE"))

class Bar(Base):
    __tablename__ = "bar" 
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    material : Mapped[str] = mapped_column(String(100), nullable=True)
    od: Mapped[float] = mapped_column(Float, nullable=True)
    _id: Mapped[float] = mapped_column(Float)
    width: Mapped[float] = mapped_column(Float)
    facing: Mapped[float] = mapped_column(Float)
    cut_off_1: Mapped[float] = mapped_column(Float)
    cut_off_2: Mapped[float] = mapped_column(Float)
    bar_end: Mapped[float] = mapped_column(Float)
    bar_lenght: Mapped[float] = mapped_column(Float)
    qty_bar: Mapped[float] = mapped_column(Float)
    bar_weight: Mapped[float] = mapped_column(Float)
    parent_part_no_id : Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"))

class TargetDailyIssue(Base):
    __tablename__ = "target_daily_issue" 
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    target_daily_issue : Mapped[int] = mapped_column(Integer, nullable=True)
    month : Mapped[int] = mapped_column(Integer, nullable=True)
    year : Mapped[int] = mapped_column(Integer, nullable=True)
    parent_part_no_id : Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"))

class Capacity(Base):
    __tablename__ = "capacity"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    ring_output : Mapped[int] = mapped_column(Integer, nullable=True)
    cycle_time : Mapped[float] = mapped_column(Float, nullable=True) 
    utl : Mapped[float] = mapped_column(Float, nullable=True)
    bite_life : Mapped[str] = mapped_column(String(100), nullable=True)
    pos_type : Mapped[str] = mapped_column(String(100), nullable=True)
    group_pos_type : Mapped[str] = mapped_column(String(100), nullable=True)
    capa_day : Mapped[int] = mapped_column(Integer, nullable=True)

    parent_part_no_id : Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"))
    machine_type_id : Mapped[int] = mapped_column(ForeignKey("machine_type.id", ondelete="CASCADE"))
    
class Ringreceive(Base):
    __tablename__ = "ring_receive"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    part_no__id: Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))

class PartFlange(Base):
    __tablename__ = "part_flange"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    part_no__id: Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))

class PartTo2nd(Base):
    __tablename__ = "part_to_2nd"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    part_no__id: Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))

class ProcessCount(Base):
    __tablename__ = "process_count"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    process_count: Mapped[int] = mapped_column(Integer, nullable=True)

class PartYield(Base):
    __tablename__ = "part_yield"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    yield_value: Mapped[float] = mapped_column(Float, nullable=True)
    part_no__id: Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))

class Turnover(Base):
    __tablename__ = "turnover"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    tn : Mapped[float] = mapped_column(Float, nullable=True)
    rsl_rod : Mapped[float] = mapped_column(Float, nullable=True)
    _2nd : Mapped[float] = mapped_column(Float, nullable=True)
    ht : Mapped[float] = mapped_column(Float, nullable=True)
    sl : Mapped[float] = mapped_column(Float, nullable=True)
    barrel_bf_od : Mapped[float] = mapped_column(Float, nullable=True)
    od : Mapped[float] = mapped_column(Float, nullable=True)
    od_sf : Mapped[float] = mapped_column(Float, nullable=True)
    _45m : Mapped[float] = mapped_column(Float, nullable=True)
    bg : Mapped[float] = mapped_column(Float, nullable=True)
    bs : Mapped[float] = mapped_column(Float, nullable=True)
    barrel_bf_race : Mapped[float] = mapped_column(Float, nullable=True)
    race : Mapped[float] = mapped_column(Float, nullable=True)
    barrel_bf_sf : Mapped[float] = mapped_column(Float, nullable=True)
    sf : Mapped[float] = mapped_column(Float, nullable=True)
    mold_od2 : Mapped[float] = mapped_column(Float, nullable=True)
    ws : Mapped[float] = mapped_column(Float, nullable=True)
    _14a1 : Mapped[float] = mapped_column(Float, nullable=True)
    turnover_turning : Mapped[float] = mapped_column(Float, nullable=True)
    max_turnover : Mapped[float] = mapped_column(Float, nullable=True)
    min_turnover : Mapped[float] = mapped_column(Float, nullable=True)
    part_no_id : Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))

class ProductionePlan(Base):
    __tablename__ = "production_plan"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    rev : Mapped[int] = mapped_column(Integer, nullable=True)
    plan_type : Mapped[str] = mapped_column(String(100), nullable=True)
    confirmed : Mapped[bool] = mapped_column(default=False)
    plan_target : Mapped[int] = mapped_column(Integer, nullable=True)
    is_machine_continue : Mapped[bool] = mapped_column(Boolean,nullable=True)
    working_date_id : Mapped[int] = mapped_column(ForeignKey("working_date.id", ondelete="CASCADE"))
    machine_id : Mapped[int] = mapped_column(ForeignKey("machine.id", ondelete="CASCADE"))
    parent_part_no_id : Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"))

class RequireTurning(Base):
    __tablename__ = "require_turning"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    due_date: Mapped[datetime.datetime] = mapped_column(nullable=False)
    part_group: Mapped[str] = mapped_column(String(100), nullable=True)
    require_turning: Mapped[int] = mapped_column(Integer, nullable=True)
    priority_group: Mapped[int] = mapped_column(Integer, nullable=True)
    turnover_parent: Mapped[float] = mapped_column(Float, nullable=True)
    wip_parent: Mapped[int] = mapped_column(Integer, nullable=True)
    target_daily_issue: Mapped[int] = mapped_column(Integer, nullable=True)

    order_no_id: Mapped[int] = mapped_column(Integer, nullable=True)
    order_no_source: Mapped[str] = mapped_column(String(20), nullable=True)

    part_no_id : Mapped[int] = mapped_column(ForeignKey("part_no.id"))
    parent_part_no_id: Mapped[int] = mapped_column(ForeignKey("parent_part_no.id", ondelete="CASCADE"), nullable=True)

class WorkingDate(Base):
    __tablename__ = "working_date"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    working_date : Mapped[datetime.datetime] = mapped_column(unique=True,index=True)
    working_hr : Mapped[float] = mapped_column(Float, nullable=True)

class Wip(Base):
    __tablename__ = "wip"
    id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    registered_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
    process_value : Mapped[str] = mapped_column(String(100), nullable=True)
    qty : Mapped[int] = mapped_column(Integer, nullable=True)
    wip_type : Mapped[str] = mapped_column(String(100), nullable=True)
    rev : Mapped[int] = mapped_column(Integer, nullable=True)
    part_no_id : Mapped[int] = mapped_column(ForeignKey("part_no.id", ondelete="CASCADE"))





















