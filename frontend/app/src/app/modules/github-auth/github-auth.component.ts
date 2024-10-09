import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { OAuthService } from 'angular-oauth2-oidc';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private oauthService: OAuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private readonly router: Router
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
      redirectUri: 'http://localhost:3000/api/v1/auth/callback',
      clientId: 'Iv23liAS8oSh0OhViBK1',
      responseType: 'code',
      scope: 'user:email',
      requireHttps: false,
      showDebugInformation: true,
    };
    this.oauthService.configure(authConfig);
  }

  connectGithub() {
    window.location.href = 'http://localhost:3000/api/v1/auth/login';
  }

  fetchUser() {
    this.http
      .get(
        `http://localhost:3000/api/v1/user?access_token=${this.accessToken}&user_id=${this.userId}`,
        { withCredentials: true }
      )
      .subscribe(
        (data) => {
          this.user = data;
          this.isLoading = false;
        },
        (error) => {
          this.isLoading = false;

          console.error('Error fetching user', error);
        }
      );
  }

  removeSync() {
    this.http
      .get(
        `http://localhost:3000/api/v1/user/remove-integration?access_token=${this.accessToken}&user_id=${this.userId}`
      )
      .subscribe(
        (response) => {},
        (error) => {
          this.router
            .navigate(['/auth'])
            .then(() => {
              this.user = null;
            })
            .catch((error) => {});

          console.error('Error while remvoing integration', error);
        }
      );
  }
}
