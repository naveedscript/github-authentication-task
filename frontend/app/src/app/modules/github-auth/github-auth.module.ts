import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GithubAuthComponent } from './github-auth.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AgGridAngular } from 'ag-grid-angular';

import { MatExpansionModule } from '@angular/material/expansion';
@NgModule({
  declarations: [GithubAuthComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    AgGridAngular
  ],
  providers: [],
  bootstrap: [GithubAuthComponent],
})
export class GithubAuthModule {}
