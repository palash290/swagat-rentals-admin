import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  @ViewChild('closeModalAdd') closeModalAdd!: ElementRef;
  userRole: string | null = null;
  showClientSubMenu = false;
  showAssetsSubMenu = false;
  showPaymentsSubMenu = false;
  showNetworkSubMenu = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.userRole = localStorage.getItem('role');
    // this.showClientSubMenu = this.isActive('/home/client-list');
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  @Output() toggleEvent = new EventEmitter<boolean>();

  toggleMenu() {
    this.toggleEvent.emit(false);
  }

  toggleClientSubMenu() {
    this.showClientSubMenu = !this.showClientSubMenu;
  }

  toggleAssetsSubMenu() {
    this.showAssetsSubMenu = !this.showAssetsSubMenu;
  }

  togglePaymentsSubMenu() {
    this.showPaymentsSubMenu = !this.showPaymentsSubMenu;
  }

    toggleNetworkSubMenu() {
    this.showNetworkSubMenu = !this.showNetworkSubMenu;
  }


}
