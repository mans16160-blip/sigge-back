const request = require("supertest");
const app = require("../app");
const path = require("path");

describe("Company API", () => {
  let companyId;

  it("should create a company and return an ID", async () => {
    const res = await request(app)
      .post("/company")
      .send({ company_name: "Test Company" })
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("message", "Company created");

    companyId = res.body.id; 
  

  });

  it("should update the company", async () => {
    const updatedData = {
      company_name: "Updated company",
    };

    const res = await request(app)
      .put(`/company/${companyId}`)
      .send(updatedData)
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Company updated");
  });

  it("should fetch the updated company by ID", async () => {
    const res = await request(app).get(`/company/${companyId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("company_id", companyId);
    expect(res.body).toHaveProperty("company_name", "Updated company");
  });
  it("should return an array of comapnies with expected fields", async () => {
    const res = await request(app).get("/company");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const company = res.body.find((u) => u.company_id === companyId);
    expect(company).toBeDefined();
    expect(company).toHaveProperty("company_id");
    expect(company).toHaveProperty("company_name");
  });

  it("should delete the company", async () => {
    const res = await request(app).delete(`/company/${companyId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Company deleted");
  });
});

describe("Cost center API", () => {
  let costCenterId;

  it("should create a cost center and return an ID", async () => {
    const res = await request(app)
      .post("/cost-center")
      .send({ cost_center_name: "Test cost center", cost_center_number: 100 })
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("message", "Cost center created");

    costCenterId = res.body.id;
  });

  it("should update the cost center", async () => {
    const updatedData = {
      cost_center_name: "Updated cost center",
      cost_center_number: 200,
    };

    const res = await request(app)
      .put(`/cost-center/${costCenterId}`)
      .send(updatedData)
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Cost center updated");
  });

  it("should fetch the updated cost center by ID", async () => {
    const res = await request(app).get(`/cost-center/${costCenterId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("cost_center_id", costCenterId);
    expect(res.body).toHaveProperty("cost_center_number", 200);
    expect(res.body).toHaveProperty("cost_center_name", "Updated cost center");
  });
  it("should return an array of cost centers with expected fields", async () => {
    const res = await request(app).get("/cost-center");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const costCenter = res.body.find((u) => u.cost_center_id === costCenterId);
    expect(costCenter).toBeDefined();
    expect(costCenter).toHaveProperty("cost_center_id");
    expect(costCenter).toHaveProperty("cost_center_name");
  });

  it("should delete the cost_center", async () => {
    const res = await request(app).delete(`/cost-center/${costCenterId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Cost center deleted");
  });
});

describe("User API", () => {
  let userId;
  let testCompanyId;
  let testCostCenterId;
  const originalEmail = "johnsmith@gmail.com";
  const originalPassword = "johnsmith123!";
  const newPassword = "johnsmithRESET123!";

  beforeAll(async () => {
    const companyRes = await request(app)
      .post("/company")
      .send({ company_name: "Test Company" });
    expect(companyRes.statusCode).toBe(201);
    testCompanyId = companyRes.body.id;

    const costCenterRes = await request(app)
      .post("/cost-center")
      .send({ cost_center_name: "Test cost center", cost_center_number: 100 });
    expect(costCenterRes.statusCode).toBe(201);
    testCostCenterId = costCenterRes.body.id;
  });

  it("should create a user and return an ID", async () => {
    const res = await request(app).post("/user").send({
      first_name: "John",
      surname: "Smith",
      email: originalEmail,
      company_id: testCompanyId,
      cost_center_id: testCostCenterId,
      password: originalPassword,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");

    userId = res.body.id;
    expect(userId).toBeDefined();
  });

  it("should initiate a password reset", async () => {
    const res = await request(app).post("/user/reset-password").send({
      usernameOrEmail: originalEmail,
    });

    expect([200, 202]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("message");
  });

  it("should update the user", async () => {
    const updatedData = {
      first_name: "John",
      surname: "Doe",
      email: "johndoe@gmail.com",
      company_id: testCompanyId,
      cost_center_id: testCostCenterId,
      password: "johndoe123!",
    };

    const res = await request(app)
      .put(`/user/${userId}`)
      .send(updatedData)
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User updated");
  });

  it("should fetch the updated user by ID", async () => {
    const res = await request(app).get(`/user/${userId}`);

    expect(res.body).toHaveProperty("user_id");
    expect(res.body).toHaveProperty("first_name");
    expect(res.body).toHaveProperty("surname");
    expect(res.body).toHaveProperty("email");
    expect(res.body).toHaveProperty("company_id");
    expect(res.body).toHaveProperty("cost_center_id");
  });

  it("should return an array of users with expected fields", async () => {
    const res = await request(app).get("/user");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const user = res.body.find((u) => u.user_id === userId);
    expect(user).toBeDefined();
    expect(user).toHaveProperty("user_id");
    expect(user).toHaveProperty("first_name");
    expect(user).toHaveProperty("surname");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("company_id");
    expect(user).toHaveProperty("cost_center_id");
  });

  it("should delete the user", async () => {
    expect(userId).toBeDefined();

    const res = await request(app).delete(`/user/${userId}`);
    expect(res.statusCode).toBe(200);
  });

  afterAll(async () => {
    const costCenterDelRes = await request(app).delete(
      `/cost-center/${testCostCenterId}`,
    );
    expect([200, 204]).toContain(costCenterDelRes.statusCode);

    const companyDelRes = await request(app).delete(
      `/company/${testCompanyId}`,
    );
    expect([200, 204]).toContain(companyDelRes.statusCode);
  });
});

describe("Receipt API", () => {
  let receiptId;
  let testUserId;
  let testCompanyIds = [];
  let testCostCenterId;
  let images;
  beforeAll(async () => {
    const company1 = await request(app)
      .post("/company")
      .send({ company_name: "Company A" });
    const company2 = await request(app)
      .post("/company")
      .send({ company_name: "Company B" });
    const company3 = await request(app)
      .post("/company")
      .send({ company_name: "Company C" });

    const costCenter = await request(app)
      .post("/cost-center")
      .send({ cost_center_name: "Test cost center", cost_center_number: 100 });
    testCostCenterId = costCenter.body.id;
    testCompanyIds = [company1.body.id, company2.body.id, company3.body.id];
    const pdfPath = path.join(__dirname, "fixtures", "sample.pdf");
    images = await request(app)
      .post("/upload")
      .set("Accept", "application/json")
      .attach("file", pdfPath);

    testCostCenterId = costCenter.body.id;
    testCompanyIds = [company1.body.id, company2.body.id, company3.body.id];

    const userRes = await request(app).post("/user").send({
      first_name: "Test",
      surname: "User",
      email: "testuser@gmail.com",
      company_id: company1.body.id,
      cost_center_id: costCenter.body.id,
      password: "testuser123!",
    });

    testUserId = userRes.body.id;
  });

  it("should create a receipt and return an ID", async () => {
    const res = await request(app)
      .post("/receipt")
      .send({
        creation_date: "2025-06-03",
        receipt_date: "2025-06-03",
        user_id: testUserId,
        company_card: true,
        tax: 25,
        net: 100,
        image_links: images,
        description: "Test receipt POST",
        charged_companies: testCompanyIds,
        represented: ["A", "B", "C"],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");

    receiptId = res.body.id;
    expect(receiptId).toBeDefined();
  });

  it("should update the receipt", async () => {
    const updatedData = {
      creation_date: "2025-06-03",
      receipt_date: "2025-06-03",
      user_id: testUserId,
      company_card: true,
      tax: 100,
      net: 400,
      description: "Test receipt PUT",
      charged_companies: testCompanyIds,
      represented: ["D", "E", "F"],
    };

    const res = await request(app)
      .put(`/receipt/${receiptId}`)
      .send(updatedData)
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Receipt updated");
  });

  it("should fetch the updated receipt by ID", async () => {
    const res = await request(app).get(`/receipt/${receiptId}`);
    const receipt = res.body;
    expect(receipt).toHaveProperty("receipt_id");
    expect(receipt).toHaveProperty("creation_date");
    expect(receipt).toHaveProperty("receipt_date");
    expect(receipt).toHaveProperty("user_id");
    expect(receipt).toHaveProperty("company_card");
    expect(receipt).toHaveProperty("tax");
    expect(receipt).toHaveProperty("net");
    expect(receipt).toHaveProperty("description");
  });

  it("should fetch all receipts for the given user ID", async () => {
    const res = await request(app).get(`/receipt/user/${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const userReceipts = res.body;
    expect(userReceipts.length).toBeGreaterThan(0);

    const found = userReceipts.find((r) => r.receipt_id === receiptId);
    expect(found).toBeDefined();
    expect(found.user_id).toBe(testUserId);
  });

  it("should return an array of all receipts", async () => {
    const res = await request(app).get("/receipt");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const receipt = res.body.find((r) => r.receipt_id === receiptId);
    expect(receipt).toBeDefined();
    expect(receipt).toHaveProperty("receipt_id");
    expect(receipt).toHaveProperty("user_id");
  });

  it("should delete the receipt", async () => {
    expect(receiptId).toBeDefined();

    const res = await request(app).delete(`/receipt/${receiptId}`);
    expect(res.statusCode).toBe(200);
  });

  afterAll(async () => {
    if (testUserId) {
      const userRes = await request(app).delete(`/user/${testUserId}`);
      expect([200, 204, 404]).toContain(userRes.statusCode);
    }

    if (testCostCenterId) {
      const ccRes = await request(app).delete(
        `/cost-center/${testCostCenterId}`,
      );
      expect([200, 204, 404]).toContain(ccRes.statusCode);
    }

    for (const companyId of testCompanyIds) {
      const companyRes = await request(app).delete(`/company/${companyId}`);
      expect([200, 204, 404]).toContain(companyRes.statusCode);
    }
  });
});

jest.mock("../services/pdfService", () => ({
  uploadPDF: jest.fn(),
}));

const pdfService = require("../services/pdfService");

describe("POST /upload", () => {
  beforeAll(() => {
    pdfService.uploadPDF.mockResolvedValue("https://imgur.com/fake-image");
  });
  it("should fetch an image and upload it to Imgur", async () => {
    const imgPath = path.join(__dirname, "fixtures", "sample.jpg");
    const res = await request(app)
      .post("/upload")
      .set("Accept", "application/json")
      .attach("file", imgPath);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Upload successful");
    expect(res.body).toHaveProperty("links");
  });

  it("should upload a PDF file and return a success message", async () => {
    const pdfPath = path.join(__dirname, "fixtures", "sample.pdf");
    jest.mock(pdfPath);
    const res = await request(app)
      .post("/upload")
      .set("Accept", "application/json")
      .attach("file", pdfPath);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Upload successful");
    expect(res.body).toHaveProperty("links", "https://imgur.com/fake-image");
  });
});
