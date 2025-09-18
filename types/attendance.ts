export interface EmployeeRow {
  직원명?: string;
  팀명?: string;
  이메일?: string;
  사번?: string | number;
}

export interface NormalizedEmployee {
  name: string;
  team: string;
  email: string;
  employeeNumber: string;
}
