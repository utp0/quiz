import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title = 'angular-project';
  testMsg: string = "";

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.http.get<string>("/api/ping").subscribe(res => {
      this.testMsg = JSON.stringify(res);
    })
  }
}
