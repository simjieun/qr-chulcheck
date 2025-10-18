export interface EmployeeRow {
  직원명?: string;
  팀명?: string;
  이메일?: string;
  사번?: string | number;
  옷사이즈?: string;
  체육대회팀명?: string;
}

export interface NormalizedEmployee {
  name: string;
  team: string;
  email: string;
  employeeNumber: string;
  clothingSize?: string;
  sportsTeam?: string;
}
