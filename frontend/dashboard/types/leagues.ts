export interface League {
  id: number;
  name: string;
  organizationName: string;
  sport: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
  form_data?: Record<string, any>;
  rejection_reason?: string | null;
}

export interface Template {
  id: number;
  name: string;
  sport: string;
  gender: string;
  dateCreated: string;
}

export interface Draft {
  id: number;
  name: string;
  sport: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}
