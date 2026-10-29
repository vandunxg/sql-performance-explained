"""Override cho phần đầu Chương 2 (part_01, u040–u050), dùng khi dựng chap_02."""
EMP_DDL = """CREATE TABLE employees (
   employee_id   NUMBER         NOT NULL,
   first_name    VARCHAR2(1000) NOT NULL,
   last_name     VARCHAR2(1000) NOT NULL,
   date_of_birth DATE           NOT NULL,
   phone_number  VARCHAR2(1000) NOT NULL,
   **CONSTRAINT employees_pk PRIMARY KEY (employee_id)**
);"""

PK_QUERY = """SELECT first_name, last_name
  FROM employees
 WHERE **employee_id = 123**"""

PK_PLAN = """---------------------------------------------------------------
|Id |Operation                   | Name         | Rows | Cost |
---------------------------------------------------------------
| 0 |SELECT STATEMENT            |              |    1 |    2 |
| 1 | TABLE ACCESS BY INDEX ROWID| EMPLOYEES    |    1 |    2 |
|*2 | **INDEX UNIQUE SCAN          | EMPLOYEES_PK** |    1 |    1 |
---------------------------------------------------------------

Predicate Information (identified by operation id):
---------------------------------------------------
   2 - access("EMPLOYEE_ID"=123)"""

# OVERRIDES: "p01-u046": code_block(EMP_DDL,"sql","SQL"), "p01-u048": PK_QUERY, "p01-u050": PK_PLAN (execution plan); HEADING_LEVEL {"p01-u044": 3}
