import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-request-bar',
  imports: [],
  templateUrl: './request-bar.html',
  styleUrl: './request-bar.scss',
})
export class RequestBar {
requestForm: FormGroup;
  isUrlFocused = signal<boolean>(false);
  private defaultUrl = 'https://api.example.com/users';

  constructor(private fb: FormBuilder) {
    this.requestForm = this.fb.group({
      method: ['GET'],
      url: ['']
    });
  }

  ngOnInit() {
    // Escuchar cambios en la URL
    this.requestForm.get('url')?.valueChanges.subscribe(value => {
      console.log('URL changed:', value);
    });
  }

  onInputFocus() {
    this.isUrlFocused.set(true);
    const currentUrl = this.requestForm.get('url')?.value;
    // Si está vacío, establece la URL por defecto
    if (!currentUrl) {
      this.requestForm.patchValue({ url: this.defaultUrl });
    }
  }

  onInputBlur() {
    this.isUrlFocused.set(false);
    const currentUrl = this.requestForm.get('url')?.value;
    // Si tiene la URL por defecto, la limpia al perder focus
    if (currentUrl === this.defaultUrl) {
      this.requestForm.patchValue({ url: '' });
    }
  }

  sendRequest() {
    const method = this.requestForm.get('method')?.value;
    const url = this.requestForm.get('url')?.value;
    if (url) {
      console.log('Sending request:', { method, url });
      // Aquí va la lógica para enviar la petición
    }
  }

  get method() {
    return this.requestForm.get('method');
  }

  get url() {
    return this.requestForm.get('url');
  }
}
