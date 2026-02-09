/**
 * F-CORE API Security Test Suite
 * 
 * Comprehensive security tests covering:
 * - Multi-tenancy isolation
 * - Input validation
 * - Authorization controls
 * - SQL injection prevention
 * - Error handling
 * 
 * ## Running Tests
 * 
 * ```bash
 * # Run all security tests
 * npm test api-security.test.ts
 * 
 * # Run with coverage
 * npm test -- --coverage api-security.test.ts
 * 
 * # Run specific test suite
 * npm test -- -t "Multi-tenancy Isolation"
 * ```
 * 
 * ## Prerequisites
 * - Test database configured (see DATABASE_URL in .env.test)
 * - Prisma migrations applied
 * - Test user accounts seeded
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '../src/app'; // Adjust path to your Express/Fastify app

const prisma = new PrismaClient();

// Test data fixtures
interface TestUser {
  id: string;
  email: string;
  tenantId: string;
  token: string;
}

let tenantA: { id: string; name: string };
let tenantB: { id: string; name: string };
let userA: TestUser;
let userB: TestUser;

/**
 * Setup test database and seed initial data
 */
beforeAll(async () => {
  // Clean up existing test data
  await prisma.deal.deleteMany();
  await prisma.company.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create test tenants
  tenantA = await prisma.tenant.create({
    data: {
      id: 'tenant-a-test',
      name: 'Tenant A Test Corp',
    },
  });

  tenantB = await prisma.tenant.create({
    data: {
      id: 'tenant-b-test',
      name: 'Tenant B Test Corp',
    },
  });

  // Create test users
  const userARecord = await prisma.user.create({
    data: {
      email: 'user-a@tenant-a.com',
      name: 'User A',
      tenantId: tenantA.id,
      password: 'hashed_password_a', // In real tests, use proper hashing
    },
  });

  const userBRecord = await prisma.user.create({
    data: {
      email: 'user-b@tenant-b.com',
      name: 'User B',
      tenantId: tenantB.id,
      password: 'hashed_password_b',
    },
  });

  // Generate authentication tokens (adjust based on your auth implementation)
  userA = {
    id: userARecord.id,
    email: userARecord.email,
    tenantId: tenantA.id,
    token: 'mock-token-user-a', // Replace with actual JWT generation
  };

  userB = {
    id: userBRecord.id,
    email: userBRecord.email,
    tenantId: tenantB.id,
    token: 'mock-token-user-b',
  };
});

/**
 * Clean up after all tests
 */
afterAll(async () => {
  await prisma.deal.deleteMany();
  await prisma.company.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.$disconnect();
});

/**
 * Clean up test data between test suites
 */
afterEach(async () => {
  await prisma.deal.deleteMany();
  await prisma.company.deleteMany();
  await prisma.contact.deleteMany();
});

// ============================================================================
// 1. MULTI-TENANCY ISOLATION TESTS
// ============================================================================

describe('Multi-tenancy Isolation', () => {
  describe('Contact Isolation', () => {
    it('should prevent Tenant A user from accessing Tenant B contacts', async () => {
      // Arrange: Create contact for Tenant B
      const contactB = await prisma.contact.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@tenant-b.com',
          tenantId: tenantB.id,
          ownerId: userB.id,
        },
      });

      // Act: Tenant A user tries to GET Tenant B contact
      const response = await request(app)
        .get(`/api/contacts/${contactB.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(404); // Should not exist for Tenant A

      // Assert
      expect(response.body).toMatchObject({
        error: expect.stringMatching(/not found|forbidden/i),
      });
    });

    it('should prevent Tenant A user from listing Tenant B contacts', async () => {
      // Arrange: Create contacts for both tenants
      await prisma.contact.create({
        data: {
          firstName: 'Alice',
          lastName: 'TenantA',
          email: 'alice@tenant-a.com',
          tenantId: tenantA.id,
          ownerId: userA.id,
        },
      });

      await prisma.contact.create({
        data: {
          firstName: 'Bob',
          lastName: 'TenantB',
          email: 'bob@tenant-b.com',
          tenantId: tenantB.id,
          ownerId: userB.id,
        },
      });

      // Act: Tenant A user lists contacts
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(200);

      // Assert: Should only see Tenant A contacts
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('alice@tenant-a.com');
      expect(response.body.data[0].tenantId).toBe(tenantA.id);
    });

    it('should isolate newly created contacts to creator tenant', async () => {
      // Act: Tenant A creates a contact
      const createResponse = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          firstName: 'New',
          lastName: 'Contact',
          email: 'new@tenant-a.com',
        })
        .expect(201);

      const contactId = createResponse.body.id;

      // Assert: Tenant B cannot see it
      await request(app)
        .get(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .expect(404);

      // Assert: Verify tenant assignment in database
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      expect(contact?.tenantId).toBe(tenantA.id);
    });
  });

  describe('Company Isolation', () => {
    it('should prevent Tenant A user from accessing Tenant B companies', async () => {
      // Arrange
      const companyB = await prisma.company.create({
        data: {
          name: 'Company B Corp',
          tenantId: tenantB.id,
          ownerId: userB.id,
        },
      });

      // Act & Assert
      await request(app)
        .get(`/api/companies/${companyB.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(404);
    });

    it('should filter company list by tenant', async () => {
      // Arrange
      await prisma.company.createMany({
        data: [
          { name: 'CompanyA1', tenantId: tenantA.id, ownerId: userA.id },
          { name: 'CompanyA2', tenantId: tenantA.id, ownerId: userA.id },
          { name: 'CompanyB1', tenantId: tenantB.id, ownerId: userB.id },
        ],
      });

      // Act
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((c: any) => c.tenantId === tenantA.id)).toBe(true);
    });
  });

  describe('Deal Isolation', () => {
    it('should prevent Tenant A user from accessing Tenant B deals', async () => {
      // Arrange
      const dealB = await prisma.deal.create({
        data: {
          title: 'Deal B',
          value: 50000,
          tenantId: tenantB.id,
          ownerId: userB.id,
        },
      });

      // Act & Assert
      await request(app)
        .get(`/api/deals/${dealB.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(404);
    });

    it('should filter deal list by tenant', async () => {
      // Arrange
      await prisma.deal.createMany({
        data: [
          { title: 'DealA1', value: 10000, tenantId: tenantA.id, ownerId: userA.id },
          { title: 'DealB1', value: 20000, tenantId: tenantB.id, ownerId: userB.id },
          { title: 'DealB2', value: 30000, tenantId: tenantB.id, ownerId: userB.id },
        ],
      });

      // Act
      const response = await request(app)
        .get('/api/deals')
        .set('Authorization', `Bearer ${userB.token}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((d: any) => d.tenantId === tenantB.id)).toBe(true);
    });
  });
});

// ============================================================================
// 2. INPUT VALIDATION TESTS
// ============================================================================

describe('Input Validation', () => {
  describe('Email Validation', () => {
    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'missing-at-sign.com',
        'double@@example.com',
        'spaces in@email.com',
        '',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'Test',
            lastName: 'User',
            email,
          })
          .expect(400);

        expect(response.body).toMatchObject({
          error: expect.stringMatching(/email|invalid|validation/i),
        });
      }
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@subdomain.example.com',
      ];

      for (const email of validEmails) {
        await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'Test',
            lastName: 'User',
            email,
          })
          .expect(201);
      }
    });
  });

  describe('Required Fields Validation', () => {
    it('should return 400 when required fields are missing', async () => {
      const invalidPayloads = [
        { lastName: 'Doe', email: 'john@example.com' }, // Missing firstName
        { firstName: 'John', email: 'john@example.com' }, // Missing lastName
        { firstName: 'John', lastName: 'Doe' }, // Missing email
        {}, // All missing
      ];

      for (const payload of invalidPayloads) {
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send(payload)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/required|missing/i);
      }
    });

    it('should specify which required fields are missing', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          lastName: 'Doe',
        })
        .expect(400);

      expect(response.body.error).toMatch(/firstName|email/i);
    });
  });

  describe('Phone Number Validation', () => {
    it('should reject invalid phone formats', async () => {
      const invalidPhones = [
        'abc123',
        '123', // Too short
        '+++invalid',
        'phone number',
      ];

      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone,
          })
          .expect(400);

        expect(response.body.error).toMatch(/phone|invalid/i);
      }
    });

    it('should accept valid phone formats', async () => {
      const validPhones = [
        '+1234567890',
        '+1-234-567-8900',
        '(123) 456-7890',
        '+84 123 456 789',
        '0123456789',
      ];

      for (const phone of validPhones) {
        await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: `john${Math.random()}@example.com`,
            phone,
          })
          .expect(201);
      }
    });
  });

  describe('URL Validation', () => {
    it('should reject invalid URLs for website field', async () => {
      const invalidUrls = [
        'not a url',
        'htp://wrong-protocol.com',
        'ftp://unsupported.com',
        'javascript:alert(1)',
      ];

      for (const website of invalidUrls) {
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            website,
          })
          .expect(400);

        expect(response.body.error).toMatch(/url|website|invalid/i);
      }
    });

    it('should accept valid URLs', async () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path?query=1',
        'https://subdomain.example.co.uk',
      ];

      for (const website of validUrls) {
        await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: `john${Math.random()}@example.com`,
            website,
          })
          .expect(201);
      }
    });

    it('should validate LinkedIn URL format', async () => {
      // Invalid LinkedIn URLs
      const invalidLinkedIn = [
        'https://twitter.com/user',
        'https://linkedin.com', // Missing /in/
        'not a url',
      ];

      for (const linkedinUrl of invalidLinkedIn) {
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            linkedinUrl,
          })
          .expect(400);

        expect(response.body.error).toMatch(/linkedin|url|invalid/i);
      }

      // Valid LinkedIn URLs
      const validLinkedIn = [
        'https://www.linkedin.com/in/johndoe',
        'https://linkedin.com/in/jane-smith-123',
        'http://www.linkedin.com/in/user',
      ];

      for (const linkedinUrl of validLinkedIn) {
        await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: `john${Math.random()}@example.com`,
            linkedinUrl,
          })
          .expect(201);
      }
    });
  });
});

// ============================================================================
// 3. AUTHORIZATION TESTS
// ============================================================================

describe('Authorization', () => {
  describe('Ownership Checks', () => {
    it('should prevent user from updating contacts they do not own', async () => {
      // Arrange: User B creates a contact
      const contactB = await prisma.contact.create({
        data: {
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob@tenant-b.com',
          tenantId: tenantB.id,
          ownerId: userB.id,
        },
      });

      // Act: User A tries to update it (even though different tenant, test within same tenant too)
      await request(app)
        .patch(`/api/contacts/${contactB.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ firstName: 'Hacked' })
        .expect(403); // or 404 depending on implementation

      // Assert: Contact unchanged
      const unchanged = await prisma.contact.findUnique({
        where: { id: contactB.id },
      });
      expect(unchanged?.firstName).toBe('Bob');
    });

    it('should prevent user from deleting contacts from other tenants', async () => {
      // Arrange
      const contactB = await prisma.contact.create({
        data: {
          firstName: 'Delete',
          lastName: 'Me',
          email: 'delete@tenant-b.com',
          tenantId: tenantB.id,
          ownerId: userB.id,
        },
      });

      // Act
      await request(app)
        .delete(`/api/contacts/${contactB.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(403); // or 404

      // Assert: Contact still exists
      const stillExists = await prisma.contact.findUnique({
        where: { id: contactB.id },
      });
      expect(stillExists).not.toBeNull();
    });

    it('should allow users to update their own contacts', async () => {
      // Arrange
      const contactA = await prisma.contact.create({
        data: {
          firstName: 'My',
          lastName: 'Contact',
          email: 'my@tenant-a.com',
          tenantId: tenantA.id,
          ownerId: userA.id,
        },
      });

      // Act
      const response = await request(app)
        .patch(`/api/contacts/${contactA.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      // Assert
      expect(response.body.firstName).toBe('Updated');
    });
  });

  describe('Owner Assignment', () => {
    it('should default ownerId to current user if not provided', async () => {
      // Act: Create contact without specifying ownerId
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          firstName: 'Auto',
          lastName: 'Owner',
          email: 'auto@example.com',
        })
        .expect(201);

      // Assert: ownerId should be userA
      expect(response.body.ownerId).toBe(userA.id);

      const contact = await prisma.contact.findUnique({
        where: { id: response.body.id },
      });
      expect(contact?.ownerId).toBe(userA.id);
    });

    it('should prevent user from creating contact with different tenant ownerId', async () => {
      // Act: User A tries to create contact owned by User B
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          firstName: 'Fake',
          lastName: 'Owner',
          email: 'fake@example.com',
          ownerId: userB.id, // Trying to assign to different tenant user
        })
        .expect(403);

      expect(response.body.error).toMatch(/owner|forbidden|unauthorized/i);
    });
  });
});

// ============================================================================
// 4. SQL INJECTION PREVENTION TESTS
// ============================================================================

describe('SQL Injection Prevention', () => {
  beforeEach(async () => {
    // Seed some test data
    await prisma.contact.create({
      data: {
        firstName: 'Legitimate',
        lastName: 'User',
        email: 'legit@example.com',
        tenantId: tenantA.id,
        ownerId: userA.id,
      },
    });
  });

  describe('Search Parameter Injection', () => {
    it('should safely handle SQL injection attempts in search', async () => {
      const injectionAttempts = [
        "'; DROP TABLE contacts; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' UNION SELECT * FROM users --",
        "1'; DELETE FROM contacts WHERE '1'='1",
        "' OR EXISTS(SELECT * FROM users) --",
      ];

      for (const maliciousQuery of injectionAttempts) {
        const response = await request(app)
          .get('/api/contacts')
          .query({ search: maliciousQuery })
          .set('Authorization', `Bearer ${userA.token}`)
          .expect(200);

        // Should return empty or safe results, not execute SQL
        expect(Array.isArray(response.body.data)).toBe(true);
        
        // Verify data integrity - legitimate contact still exists
        const contactsStillExist = await prisma.contact.count({
          where: { tenantId: tenantA.id },
        });
        expect(contactsStillExist).toBeGreaterThan(0);
      }
    });

    it('should properly escape special characters in search', async () => {
      // Arrange: Create contact with special characters
      await prisma.contact.create({
        data: {
          firstName: "O'Brien",
          lastName: 'Test-User',
          email: 'obrien@example.com',
          tenantId: tenantA.id,
          ownerId: userA.id,
        },
      });

      // Act: Search for name with apostrophe
      const response = await request(app)
        .get('/api/contacts')
        .query({ search: "O'Brien" })
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(200);

      // Assert: Should find the contact safely
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((c: any) => c.firstName === "O'Brien")).toBe(true);
    });
  });

  describe('Filter Parameter Injection', () => {
    it('should prevent SQL injection in filter parameters', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .query({ email: "' OR '1'='1" })
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(200);

      // Should not return all records
      expect(response.body.data).toEqual([]);
    });

    it('should prevent SQL injection in sort parameters', async () => {
      const maliciousSorts = [
        "firstName; DROP TABLE contacts; --",
        "firstName' OR '1'='1",
      ];

      for (const sort of maliciousSorts) {
        await request(app)
          .get('/api/contacts')
          .query({ sort })
          .set('Authorization', `Bearer ${userA.token}`);
        
        // Verify table still exists
        const count = await prisma.contact.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  describe('Prisma Parameterization Verification', () => {
    it('should use parameterized queries for all user input', async () => {
      // This test verifies Prisma's built-in protection
      const userInput = "'; DELETE FROM contacts WHERE '1'='1; --";

      await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          firstName: userInput,
          lastName: 'Test',
          email: 'test@example.com',
        })
        .expect(201);

      // Verify: Input stored as-is, not executed
      const contact = await prisma.contact.findFirst({
        where: { firstName: userInput },
      });
      expect(contact).not.toBeNull();
      expect(contact?.firstName).toBe(userInput);

      // Verify: All other contacts still exist
      const totalContacts = await prisma.contact.count();
      expect(totalContacts).toBeGreaterThan(1);
    });
  });
});

// ============================================================================
// 5. ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  describe('404 Not Found', () => {
    it('should return 404 when contact does not exist', async () => {
      const nonExistentId = 'non-existent-id-12345';

      const response = await request(app)
        .get(`/api/contacts/${nonExistentId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/not found/i),
      });
    });

    it('should return 404 when company does not exist', async () => {
      const response = await request(app)
        .get('/api/companies/fake-id')
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 404 when deal does not exist', async () => {
      const response = await request(app)
        .get('/api/deals/fake-id')
        .set('Authorization', `Bearer ${userA.token}`)
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });
  });

  describe('401 Unauthorized', () => {
    it('should return 401 when no authentication token provided', async () => {
      const response = await request(app)
        .get('/api/contacts')
        // No Authorization header
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringMatching(/unauthorized|authentication/i),
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body.error).toMatch(/unauthorized|invalid.*token/i);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = 'expired-jwt-token'; // Mock an expired token

      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toMatch(/expired|unauthorized/i);
    });
  });

  describe('500 Internal Server Error', () => {
    it('should handle database errors gracefully', async () => {
      // Simulate database error by disconnecting
      await prisma.$disconnect();

      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`);

      // Should return 500, not crash
      expect([500, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/error|unavailable/i);

      // Reconnect for other tests
      await prisma.$connect();
    });

    it('should not leak sensitive error details to client', async () => {
      // Force an error condition
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          // Add field that might cause DB constraint error
          tenantId: 'non-existent-tenant',
        })
        .expect(400); // or 500

      // Should not expose stack traces or DB details
      expect(response.body.error).not.toMatch(/prisma|database|stack|at Object\./i);
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should log errors server-side while returning generic message', async () => {
      // This test would require mocking your logger
      // Example assertion structure:
      const response = await request(app)
        .get('/api/contacts/trigger-error') // Mock endpoint that throws
        .set('Authorization', `Bearer ${userA.token}`);

      // Client gets generic message
      expect(response.body.error).toMatch(/error occurred/i);
      
      // Server logs detailed error (verify via logger mock)
      // expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('detailed error'));
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format across all endpoints', async () => {
      const errorResponses = await Promise.all([
        request(app).get('/api/contacts/fake-id').set('Authorization', `Bearer ${userA.token}`),
        request(app).get('/api/contacts').set('Authorization', 'Bearer invalid'),
        request(app).post('/api/contacts').set('Authorization', `Bearer ${userA.token}`).send({}),
      ]);

      for (const response of errorResponses) {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
        // Optionally check for additional fields like error code
        // expect(response.body).toHaveProperty('code');
      }
    });
  });
});

// ============================================================================
// ADDITIONAL EDGE CASES
// ============================================================================

describe('Additional Security Edge Cases', () => {
  describe('Bulk Operations', () => {
    it('should enforce tenant isolation in bulk delete', async () => {
      // Arrange: Create contacts in both tenants
      const contactA = await prisma.contact.create({
        data: {
          firstName: 'A',
          lastName: 'User',
          email: 'a@example.com',
          tenantId: tenantA.id,
          ownerId: userA.id,
        },
      });

      const contactB = await prisma.contact.create({
        data: {
          firstName: 'B',
          lastName: 'User',
          email: 'b@example.com',
          tenantId: tenantB.id,
          ownerId: userB.id,
        },
      });

      // Act: User A tries to bulk delete with both IDs
      const response = await request(app)
        .delete('/api/contacts/bulk')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ ids: [contactA.id, contactB.id] })
        .expect(200); // or 207 for partial success

      // Assert: Only Tenant A contact deleted
      const aExists = await prisma.contact.findUnique({ where: { id: contactA.id } });
      const bExists = await prisma.contact.findUnique({ where: { id: contactB.id } });

      expect(aExists).toBeNull();
      expect(bExists).not.toBeNull();
    });
  });

  describe('Rate Limiting (if implemented)', () => {
    it('should rate-limit excessive requests', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/contacts')
          .set('Authorization', `Bearer ${userA.token}`)
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);

      // Expect some requests to be rate-limited
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${userA.token}`);

      // Check for security headers (adjust based on your setup)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
