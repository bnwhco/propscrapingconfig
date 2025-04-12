import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { scrapingFunction } from './functions/scrapingFunction/resource';
// import { Stack } from 'aws-cdk-lib'; // Uncomment if needing CDK overrides

const backend = defineBackend({
  auth,
  data,
  scrapingFunction,
});

// Grant authenticated users permission to invoke the scraping function via API Gateway
// This relies on API Gateway's default IAM authorization being set up by Amplify for the function
// or manually configuring the authorizer to use Cognito User Pools.
backend.scrapingFunction.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

// Example: Granting the scraping function read access to the DomainConfig table
// This would be needed if the function logic required fetching the config itself.
// backend.data.resources.tables.DomainConfig.grantReadData(backend.scrapingFunction.resources.lambda);


// If you need finer control over the HTTP API endpoint (e.g., specific path, method, authorizer):
// const api = backend.resources.get('HttpApi') as apiGateway.HttpApi; // Needs import { aws_apigatewayv2 as apiGateway } from 'aws-cdk-lib';
// const cognitoAuthorizer = new HttpUserPoolAuthorizer('CognitoAuthorizer', api, { // Needs import { HttpUserPoolAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
//   userPool: backend.auth.resources.userPool,
//   userPoolClient: backend.auth.resources.userPoolClient
// });
//
// api.addRoutes({
//   path: '/scrape',
//   methods: [apiGateway.HttpMethod.GET],
//   integration: new HttpLambdaIntegration('ScraperIntegration', backend.scrapingFunction.resources.lambda), // Needs import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
//   authorizer: cognitoAuthorizer,
// });
// Note: Using CDK L2/alpha constructs might require additional setup/dependencies. Rely on grantInvoke first.

// Ensure the function's invoke URL is added to the outputs
// The exact attribute might vary slightly, check CloudFormation output if needed.
// Using functionUrl requires function URL auth type to be AWS_IAM if using grantInvoke.
// If API Gateway is used (default), the API Gateway endpoint is needed.
// Let's add both common possibilities to outputs for flexibility.
backend.addOutput({
    custom: {
        // Option 1: API Gateway Endpoint (Amplify usually sets this up)
        // The structure `scrapingFunction.resources.cfnResources.ApiGatewayHttpApi` depends on Amplify's internal naming.
        // Inspect outputs.json after deployment for the exact structure.
        // Placeholder: Assume Amplify provisions an API Gateway endpoint.
        // The specific output key might be different. Check outputs.json.
        ScraperApiEndpoint: backend.scrapingFunction.resources.httpApi?.url ?? 'Check outputs.json for API Gateway endpoint',

        // Option 2: Lambda Function URL (if configured)
        // This requires setting `urlAuthType` on the function definition if used directly.
        ScraperFunctionUrl: backend.scrapingFunction.resources.cfnFunction.attrFunctionUrl ?? 'Function URL not configured'
    }
});

export default backend;