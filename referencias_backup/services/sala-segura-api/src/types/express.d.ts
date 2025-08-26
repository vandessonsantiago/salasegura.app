declare module 'express' {
  interface Router {
    get(path: string, ...handlers: any[]): Router;
    post(path: string, ...handlers: any[]): Router;
    put(path: string, ...handlers: any[]): Router;
    delete(path: string, ...handlers: any[]): Router;
    use(path: string, ...handlers: any[]): Router;
  }

  interface Request {
    body: any;
    headers: any;
    params: any;
    query: any;
    user?: any;
  }

  interface Response {
    status(code: number): Response;
    json(data: any): Response;
    send(data: any): Response;
    setHeader(name: string, value: string): Response;
  }

  interface NextFunction {
    (err?: any): void;
  }
}

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient {
    signInWithPassword(credentials: any): Promise<any>;
    signOut(): Promise<any>;
    getUser(token: string): Promise<any>;
    resetPasswordForEmail(email: string, options?: any): Promise<any>;
    admin: {
      createUser(userData: any): Promise<any>;
      updateUserById(id: string, userData: any): Promise<any>;
      listUsers(): Promise<any>;
    };
  }
}
