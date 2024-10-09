import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GithubAuthComponent } from './modules/github-auth/github-auth.component';
import { PageNotFoundComponent } from './modules/page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    component: GithubAuthComponent,
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
