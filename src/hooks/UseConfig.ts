import { useState, useEffect, useCallback } from 'react';
// Import the generated data client and schema type
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource'; // Adjust path if needed
import type { DomainConfigData } from '../types'; // Import shared type

// Generate the client instance using the schema type
const client = generateClient<Schema>();

export const useConfig = () => {
  const [configs, setConfigs] = useState<DomainConfigData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all system-wide configs
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching domain configs...");
    try {
      // Use the client to list DomainConfig items.
      // Auth mode is 'userPool' by default (set in data/resource.ts),
      // ensuring the user is authenticated.
      // The schema's auth rules (`allow.authenticated()`) grant read access.
      const { data: fetchedConfigs, errors } = await client.models.DomainConfig.list();

      if (errors) {
        console.error("Error fetching configs:", errors);
        throw new Error(errors.map(e => e.message).join('\n'));
      }

      console.log("Fetched configs:", fetchedConfigs);
      // Map to the component's data structure, ensuring fieldMappings is an object
      setConfigs(fetchedConfigs.map(cfg => ({
          domain: cfg.domain, // Domain is the primary key now
          // Ensure fieldMappings is parsed if it was somehow stored as a string, default to {}
          fieldMappings: (typeof cfg.fieldMappings === 'string' ? JSON.parse(cfg.fieldMappings) : cfg.fieldMappings) as Record<string, string> || {},
          // Include createdAt/updatedAt if needed by the UI
          createdAt: cfg.createdAt,
          updatedAt: cfg.updatedAt,
      })));
    } catch (err: any) {
      console.error("Error in fetchConfigs hook:", err);
      setError(err.message || 'Failed to fetch configurations.');
      setConfigs([]); // Clear configs on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Save (create or update) a config using domain as the primary key
  const saveConfig = useCallback(async (domain: string, mappings: Record<string, string>) => {
    setLoading(true);
    setError(null);
    console.log(`Attempting to save config for domain: ${domain}`);
    try {
      // Check if a config for this domain already exists using the primary key
      const { data: existing, errors: fetchErrors } = await client.models.DomainConfig.get({ domain });

      if (fetchErrors) {
          // If error is 'DataStore item not found', it means we need to create
          // Check the specific error structure/message Amplify returns
          const notFoundError = fetchErrors.find(e => e.message.includes('not found') || e.message.includes('Cannot return null for non-nullable type')); // Adjust error check
          if (!notFoundError) {
              // If it's another error, throw it
              console.error("Error fetching existing config before save:", fetchErrors);
              throw new Error(fetchErrors.map(e => e.message).join('\n'));
          }
           // Config does not exist, proceed to create
           console.log(`Config for domain ${domain} not found. Creating new one.`);
      }


      let savedOrUpdatedConfigData: Schema['DomainConfig']['type'] | null = null;

      if (existing) {
        console.log(`Updating existing config for domain: ${domain}`);
        // Update existing config - use the primary key 'domain'
        const { data: updatedConfig, errors: updateErrors } = await client.models.DomainConfig.update({
          domain: domain, // Specify the identifier
          fieldMappings: mappings,
        });
        if (updateErrors) {
            console.error("Error updating config:", updateErrors);
            throw new Error(updateErrors.map(e => e.message).join('\n'));
        }
        savedOrUpdatedConfigData = updatedConfig;
        console.log("Update successful:", savedOrUpdatedConfigData);
      } else {
        console.log(`Creating new config for domain: ${domain}`);
        // Create new config
        const { data: newConfig, errors: createErrors } = await client.models.DomainConfig.create({
          domain: domain, // Set the primary key
          fieldMappings: mappings,
        });
        if (createErrors) {
            console.error("Error creating config:", createErrors);
            throw new Error(createErrors.map(e => e.message).join('\n'));
        }
        savedOrUpdatedConfigData = newConfig;
        console.log("Create successful:", savedOrUpdatedConfigData);
      }

      // Refresh the local state after successful save/update
      await fetchConfigs(); // Refetch all configs to update the list
      // Map the saved config to the component data type
      if (savedOrUpdatedConfigData) {
           return {
                domain: savedOrUpdatedConfigData.domain,
                fieldMappings: (typeof savedOrUpdatedConfigData.fieldMappings === 'string' ? JSON.parse(savedOrUpdatedConfigData.fieldMappings) : savedOrUpdatedConfigData.fieldMappings) as Record<string, string> || {},
                createdAt: savedOrUpdatedConfigData.createdAt,
                updatedAt: savedOrUpdatedConfigData.updatedAt,
           } as DomainConfigData;
      }
      return null;

    } catch (err: any) {
      console.error("Error in saveConfig hook:", err);
      setError(err.message || 'Failed to save configuration.');
      return null; // Indicate failure
    } finally {
      setLoading(false);
    }
  }, [fetchConfigs]); // Depend only on fetchConfigs (which itself is stable)

  // Load configs on initial hook mount
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]); // Depend on the stable fetchConfigs callback

  return { configs, loading, error, saveConfig, fetchConfigs };
};