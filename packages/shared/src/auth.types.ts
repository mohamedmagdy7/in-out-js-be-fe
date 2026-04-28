export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  company_id: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id: string | null;
  company_slug: string | null;
};
