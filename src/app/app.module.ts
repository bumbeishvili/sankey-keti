import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { D3SankeyChartNewComponent } from './sankey/sankey.component';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [AppComponent, D3SankeyChartNewComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
