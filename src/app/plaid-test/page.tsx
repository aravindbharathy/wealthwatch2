import PlaidSandboxTest from '../../components/PlaidSandboxTest';

export default function PlaidTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Plaid Sandbox Integration Test
          </h1>
          <p className="text-gray-600">
            Test the complete Plaid sandbox token flow including token creation, exchange, and holdings retrieval.
          </p>
        </div>
        
        <PlaidSandboxTest />
      </div>
    </div>
  );
}
