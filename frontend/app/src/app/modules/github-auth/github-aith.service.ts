import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

interface FetchFAQ {
  query: string;
  filter: string;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  constructor(private http: HttpClient) {}

  public fetchUser(accessToken: string, userId: any): Observable<any> {
    return this.http
      .get(
        `http://localhost:3000/api/v1/user?access_token=${accessToken}&user_id=${userId}`,
        { withCredentials: true }
      )
      .pipe(
        map((response) => response),
        catchError((error) => throwError(error))
      );
  }

  public removeIntegration(accessToken: string, userId: any): Observable<any> {
    return this.http
      .get(
        `http://localhost:3000/api/v1/user/remove-integration?access_token=${accessToken}&user_id=${userId}`,
        { withCredentials: true }
      )
      .pipe(
        map((response) => response),
        catchError((error) => throwError(error))
      );
  }

  public fetchUserRepos(accessToken: any): Observable<any> {
    return this.http
      .get(
        `http://localhost:3000/api/v1/user/repos?access_token=${accessToken}`
      )
      .pipe(
        map((response) => response),
        catchError((error) => throwError(error))
      );
  }

  public fetchUserReposMeta(accessToken: string,repoName:string): Observable<any> {
    return this.http
      .get(
        `http://localhost:3000/api/v1/user/repos/meta?access_token=${accessToken}&repo_full_name=${repoName}`
      )
      .pipe(
        map((response) => response),
        catchError((error) => throwError(error))
      );
  }
}
