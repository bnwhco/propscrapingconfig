import { defineData} from '@aws-amplify/backend-data';
// The schema builder 'a' comes from the data-schema package
import { a } from '@aws-amplify/data-schema';
import { type ClientSchema } from '@aws-amplify/backend';
/*
Define the DomainConfig model.
NOTE: Authorization is set to allow any authenticated user to manage configs.
For production, consider restricting create/update/delete to an 'admin' group:
.authorization(allow => [
  allow.authenticated().to(['read']),
  allow.group('admin').to(['create', 'update', 'delete'])
])
*/
const schema = a.schema({
  /**
   * Stores the screen scraping configuration for a specific domain.
   * This configuration is system-wide, not per-user.
   */
  DomainConfig: a.model({
    /**
     * The normalized domain name (e.g., "realestate.com.au").
     * This acts as the primary identifier for the config.
     * Using `@primaryKey` makes querying by domain efficient.
     */
    domain: a.string().required(),
    /**
     * The mapping from scraped field names to desired field names.
     * Stored as a flexible JSON object.
     * Example: { "scraped_price": "askingPrice", "bedrooms_scraped": "numBedrooms" }
     */
    fieldMappings: a.json().required(),

    // Timestamps (createdAt, updatedAt) are added automatically
  })
  // Allow any authenticated user to read, create, update, and delete configs.
  // WARNING: This might be too permissive for system-wide configurations.
  // Consider using group-based authorization ('admin') for CUD operations in production.
  .authorization(allow => [allow.authenticated()])
});
// Type helper for generating the client (used internally by Amplify)
export type Schema = ClientSchema<typeof schema>;
// Export the schema definition for Amplify to process
export const data = defineData({
  schema,
  authorizationModes: {
    // Default authorization mode for the generated client
    defaultAuthorizationMode: 'userPool', // Use Cognito User Pools for authenticated access
  },
});

