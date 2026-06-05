import { TestBed } from '@angular/core/testing';
import { RequestTabs } from './request-tabs';

describe('RequestTabs', () => {
  let component: RequestTabs;

  beforeEach(async () => {
    // Configure Angular testing module
    await TestBed.configureTestingModule({
      imports: [RequestTabs],
    }).compileComponents();

    // Create component instance
    const fixture = TestBed.createComponent(RequestTabs);

    component = fixture.componentInstance;
  });

  it('should generate GET curl', () => {
    // Generate a basic GET request
    const curl = component.generateCurlCommand('GET', 'https://api.test.com');

    // Should include method + URL
    expect(curl).toContain("curl -X GET 'https://api.test.com'");

    // GET requests should not include a body
    expect(curl).not.toContain('-d');
  });

  it('should add Content-Type for JSON POST', () => {
    // Simulate user adding JSON body
    component.form.patchValue({
      body: {
        type: 'json',
        jsonContent: '{"name":"memo"}',
      },
    });

    // Generate POST request
    const curl = component.generateCurlCommand('POST', 'https://api.test.com');

    // Should automatically add JSON content type
    expect(curl).toContain('Content-Type: application/json');

    // Should include request body
    expect(curl).toContain(`-d '{"name":"memo"}'`);
  });

  it('should not duplicate Content-Type header', () => {
    // Simulate user manually adding Content-Type
    component.headers.push(component['createKeyValueRow']('Content-Type', 'application/json'));

    // Add JSON body
    component.form.patchValue({
      body: {
        type: 'json',
        jsonContent: '{"name":"memo"}',
      },
    });

    // Generate request
    const curl = component.generateCurlCommand('POST', 'https://api.test.com');

    // Content-Type should appear only once
    const matches = curl.match(/Content-Type/g) || [];

    expect(matches.length).toBe(1);
  });

  it('should append query params', () => {
    // Simulate user adding query params
    component.params.push(component['createKeyValueRow']('page', '1'));

    component.params.push(component['createKeyValueRow']('search', 'angular'));

    // Generate GET request
    const curl = component.generateCurlCommand('GET', 'https://api.test.com');

    // URL should include query params
    expect(curl).toContain('page=1');
    expect(curl).toContain('search=angular');
  });

  it('should add bearer auth', () => {
    // Simulate user adding bearer token
    component.auth.patchValue({
      type: 'bearer',
      bearerToken: 'abc123',
    });

    // Generate request
    const curl = component.generateCurlCommand('GET', 'https://api.test.com');

    // Should include Authorization header
    expect(curl).toContain('Authorization: Bearer abc123');
  });
});
