export interface LoginBody {
  email: string;
  password: string;
  company_slug?: string;
}

export interface RefreshBody {
  refresh_token?: string;
}
