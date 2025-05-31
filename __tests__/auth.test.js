const { describe, it, expect, beforeEach, afterAll } = require("@jest/globals");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/auth");
const { pool } = require("../config/db");

const { login, signup, jsonrefresh } = authController;

// Mock environment variables
process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const mockRequest = (body, headers = {}) => ({
  body,
  headers,
});
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock model auth
jest.mock("../models/auth", () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

// Mock db pool
jest.mock("../config/db", () => ({
  pool: {
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(),
  },
}));

const authModel = require("../models/auth");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Login", () => {
    it("should log in successfully with valid credentials", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        password: "hashed-password",
        username: "testuser",
      };
      authModel.findUserByEmail.mockResolvedValue({ rows: [user] });
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
      jest.spyOn(jwt, "sign")
        .mockReturnValueOnce("mock-access-token")
        .mockReturnValueOnce("mock-refresh-token");

      const req = mockRequest({ email: "test@example.com", password: "password" });
      const res = mockResponse();

      await login(req, res);

      expect(authModel.findUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(bcrypt.compare).toHaveBeenCalledWith("password", "hashed-password");
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
        },
      });
    });

    it("should return 401 for incorrect password", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        password: "hashed-password",
        username: "testuser",
      };
      authModel.findUserByEmail.mockResolvedValue({ rows: [user] });
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      const req = mockRequest({ email: "test@example.com", password: "wrong" });
      const res = mockResponse();

      await login(req, res);

      expect(authModel.findUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(bcrypt.compare).toHaveBeenCalledWith("wrong", "hashed-password");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return 401 for non-existent email", async () => {
      authModel.findUserByEmail.mockResolvedValue({ rows: [] });

      const req = mockRequest({ email: "nonexistent@example.com", password: "password" });
      const res = mockResponse();

      await login(req, res);

      expect(authModel.findUserByEmail).toHaveBeenCalledWith("nonexistent@example.com");
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });
  });

  describe("Signup", () => {
    it("should sign up successfully with valid credentials", async () => {
      const newUser = {
        id: 1,
        email: "newuser@example.com",
        password: "hashed-password",
        username: "newuser",
      };
      authModel.findUserByEmail.mockResolvedValue({ rows: [] });
      jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password");
      authModel.createUser.mockResolvedValue({ rows: [newUser] });
      jest.spyOn(jwt, "sign")
        .mockReturnValueOnce("mock-access-token")
        .mockReturnValueOnce("mock-refresh-token");

      const req = mockRequest({
        email: "newuser@example.com",
        password: "password",
        username: "newuser",
      });
      const res = mockResponse();

      await signup(req, res);

      expect(authModel.findUserByEmail).toHaveBeenCalledWith("newuser@example.com");
      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(authModel.createUser).toHaveBeenCalledWith(
        "newuser@example.com",
        "hashed-password",
        "newuser"
      );
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: {
          id: 1,
          email: "newuser@example.com",
          username: "newuser",
        },
      });
    });

    it("should return 400 if email is already registered", async () => {
      const existingUser = {
        id: 1,
        email: "existing@example.com",
        password: "hashed-password",
        username: "existinguser",
      };
      authModel.findUserByEmail.mockResolvedValue({ rows: [existingUser] });

      const req = mockRequest({
        email: "existing@example.com",
        password: "password",
        username: "newuser",
      });
      const res = mockResponse();

      await signup(req, res);

      expect(authModel.findUserByEmail).toHaveBeenCalledWith("existing@example.com");
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(authModel.createUser).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email already registered" });
    });

    it("should return 400 for missing fields", async () => {
      const req = mockRequest({ email: "", password: "", username: "" });
      const res = mockResponse();

      await signup(req, res);

      expect(authModel.findUserByEmail).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(authModel.createUser).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
    });
  });

  describe("Jsonrefresh", () => {
    it("should refresh token successfully with valid refresh token", async () => {
      const payload = { id: 1 };
      jest.spyOn(jwt, "verify").mockReturnValue(payload);
      jest.spyOn(jwt, "sign").mockReturnValue("new-access-token");

      const req = mockRequest({}, { authorization: "Bearer valid-refresh-token" });
      const res = mockResponse();

      await jsonrefresh(req, res);

      expect(jwt.verify).toHaveBeenCalledWith("valid-refresh-token", "test-refresh-secret");
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, "test-secret", { expiresIn: "1h" });
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ accessToken: "new-access-token" });
    });

    it("should return 401 if no token is provided", async () => {
      const req = mockRequest({}, {}); // No authorization header
      const res = mockResponse();

      await jsonrefresh(req, res);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "No token provided" });
    });

    it("should return 403 for invalid refresh token", async () => {
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const req = mockRequest({}, { authorization: "Bearer invalid-refresh-token" });
      const res = mockResponse();

      await jsonrefresh(req, res);

      expect(jwt.verify).toHaveBeenCalledWith("invalid-refresh-token", "test-refresh-secret");
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired refresh token" });
    });
  });
});
