## Automated Testing with GitHub Actions

This project uses **Jest** for unit tests and **Postman** (via **Newman**) for API tests. Both are integrated into **GitHub Actions** to ensure continuous testing for every push or pull request.

---

### Unit Testing with Jest (Auth Module)

you can use [Jest](https://jestjs.io/) for testing the authentication logic (login, signup, token refresh).

- **Test location**:  
  `tests/` folder

- **Run tests locally**:
  npm install
  npm test

- **Automated CI**:
  A GitHub Actions workflow (.github/workflows/jest.yml) runs Jest tests on:
  Every push to main
  Every pull request to main

### API Testing with Postman (Auth Module)

you can use Postman collections and Newman to test API endpoints like /signup, /login, and /refresh.

Collection location:
tests/postman/gardening-app-signup-demo.json

Run Postman tests locally:
npm install -g newman
newman run tests/postman/gardening-app-signup-demo.json --env-var baseUrl=http://localhost:3000/api/auth

- **Automated CI**:
  A GitHub Actions workflow (.github/workflows/postman.yml) runs the Postman tests automatically on:
  Every push to main
  Every pull request to main
