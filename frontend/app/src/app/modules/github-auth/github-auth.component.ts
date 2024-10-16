import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { OAuthService } from 'angular-oauth2-oidc';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef } from 'ag-grid-community'; // Import ColDef for column definitions
import { GithubService } from './github-aith.service';
import slugify from 'slugify';

@Component({
  selector: 'github-auth',
  templateUrl: './github-auth.component.html',
  styleUrls: ['./github-auth.component.scss'],
})
export class GithubAuthComponent implements OnInit {
  user: any;
  accessToken: any;
  userId: any;
  isLoading: any = false;
  isMetaLoading: any = false;
  isAnyRecordSeletec: any = false;
  isFetchingOrg: any = false;
  organizationTableHeaders: ColDef[] = [
    { headerName: 'ID', field: 'id' },
    { headerName: 'Name', field: 'name' },
    { headerName: 'Link', field: 'link' },
    { headerName: 'Slug', field: 'slug' },
    { headerName: 'Organization', field: 'organization' },
    {
      headerName: 'Included',
      field: 'included',
      editable: true,
    },
  ];

  repoMetaTableHeaders: ColDef[] = [
    { headerName: 'UserID', field: 'userId' },
    { headerName: 'User', field: 'user' },
    { headerName: 'Total Commits', field: 'totalCommits' },
    { headerName: 'Total Pull Request', field: 'totalPullRequests' },
    { headerName: 'Total Issues', field: 'totalIssues' },
  ];

  orgReposData: any = [];
  repoMetaData: any = [];

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private oauthService: OAuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private readonly router: Router,
    private readonly githubAuthService: GithubService
  ) {
    // Register the GitHub icon
    this.matIconRegistry.addSvgIcon(
      'github',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/github-mark.svg')
    );
  }

  ngOnInit() {
    this.isLoading = true;
    this.configureOAuth();

    this.route.queryParams.subscribe((params) => {
      this.accessToken = params['access_token'];
      this.userId = params['user_id'];
      if (this.accessToken) {
        this.oauthService.getAccessToken();
        this.fetchUser();
      } else {
        this.isLoading = false;
        console.log(
          this.oauthService.hasValidAccessToken(),
          'this.oauthService.hasValidAccessToken()'
        );
        if (this.oauthService.hasValidAccessToken()) {
          this.fetchUser();
        }
      }
    });
  }

  private configureOAuth() {
    const authConfig = {
      issuer: 'http://localhost:3000/api/v1/auth/login',
      redirectUri: 'http://localhost:4200/auth',
      clientId: 'Ov23liZdO1pe4X3Kjjug',
      responseType: 'code',
      scope: 'read:org',
      requireHttps: false,
      showDebugInformation: true,
    };
    this.oauthService.configure(authConfig);
  }

  connectGithub() {
    window.location.href = 'http://localhost:3000/api/v1/auth/login';
  }

  fetchUser() {
    this.githubAuthService.fetchUser(this.accessToken, this.userId).subscribe({
      next: (data: any) => {
        this.user = data;
        this.isLoading = false;
        if (this.user) this.fetchUserRepos();
      },
      error: (error: any) => {
        if ((error.status = 401)) this.user = null;
        console.log(this.user, 'this.userthis.userthis.user');
        console.error('Error fetching user:', error);
        this.isLoading = false;
      },
    });
  }

  removeSync() {
    this.githubAuthService
      .removeIntegration(this.accessToken, this.userId)
      .subscribe({
        next: (data: any) => {},
        error: (error: any) => {
          this.router
            .navigate(['/auth'])
            .then(() => {
              this.user = null;
            })
            .catch((error) => {});
        },
      });
  }
  fetchUserRepos() {
    this.isFetchingOrg = true;
    this.githubAuthService.fetchUserRepos(this.accessToken).subscribe({
      next: (response: any) => {
        console.log(response.records, 'datadatadata');
        response.records.forEach((org: any) => {
          org.repositories.forEach((repo: any) => {
            const repoObj = {
              id: repo.id,
              organization: org.organization.login,
              name: repo?.name || '',
              link: repo?.clone_url,
              full_name: repo?.full_name,
              slug: slugify(repo?.name, {
                replacement: '-',
                remove: undefined,
                lower: true,
                trim: true,
              }),
              included: false,
            };
            this.orgReposData.push(repoObj);
            this.isFetchingOrg = false;
          });
        });
      },
      error: (error: any) => {
        this.isFetchingOrg = false;
        console.error('Error fetching user:', error);
      },
    });
  }

  onRowDataUpdated(event: any) {
    this.orgReposData[event.rowIndex].included = event.value;
    console.log(this.orgReposData[event.rowIndex].included);
    if (this.orgReposData[event.rowIndex].included)
      this.handleRowClick(this.orgReposData[event.rowIndex]);
  }

  onRowClicked(event: any): void {
    this.handleRowClick(event.data);
  }

  handleRowClick(data: any): void {
    if (data.included) {
      this.repoMetaData = [];
      this.isAnyRecordSeletec = true;
      this.isMetaLoading = true;
      this.githubAuthService
        .fetchUserReposMeta(this.accessToken, data.full_name)
        .subscribe({
          next: (response: any) => {
            console.log(response.records);
            this.repoMetaData = response.records;
            this.isMetaLoading = false;
          },
          error: (error: any) => {
            console.error('Error fetching user:', error);
            this.isMetaLoading = false;
          },
        });
    }
  }
}
