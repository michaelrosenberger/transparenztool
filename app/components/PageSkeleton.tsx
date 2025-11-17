import Container from "./Container";

export default function PageSkeleton() {
  return (
    <Container asPage>
        {/* Header skeleton */}
        <div className="mb-1 animate-pulse min-h-[160px]">
          <div className="h-12 bg-gray-200 rounded-md w-2/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
        </div>

        {/* Card skeletons */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded-md w-full"></div>
              <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded-md w-full"></div>
              <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
            </div>
          </div>
        </div>
    </Container>
  );
}
