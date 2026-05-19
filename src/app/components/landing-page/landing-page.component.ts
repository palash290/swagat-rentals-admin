import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingFooterComponent } from './shared/landing-footer/landing-footer.component';
import { HomeServiceSectionComponent } from './shared/home-service-section/home-service-section.component';
import { HomeAboutSectionComponent } from './shared/home-about-section/home-about-section.component';
import { HomeContactSectionComponent } from './shared/home-contact-section/home-contact-section.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    LandingFooterComponent,
    HomeServiceSectionComponent,
    HomeAboutSectionComponent,
    HomeContactSectionComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
  encapsulation: ViewEncapsulation.None
})
export class LandingPageComponent {

}
