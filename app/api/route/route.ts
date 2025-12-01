import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get('start'); // format: "lat,lng"
  const end = searchParams.get('end'); // format: "lat,lng"

  if (!start || !end) {
    return NextResponse.json(
      { error: 'Missing start or end coordinates' },
      { status: 400 }
    );
  }

  try {
    // Parse coordinates
    const [startLat, startLng] = start.split(',').map(Number);
    const [endLat, endLng] = end.split(',').map(Number);

    // Call OSRM API from server side (no CORS issues)
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`OSRM API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
      // Convert coordinates from [lng, lat] to [lat, lng]
      const coordinates = data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );

      return NextResponse.json({
        success: true,
        coordinates,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
      });
    }

    throw new Error('Invalid OSRM response structure');
  } catch (error) {
    console.error('Error fetching route:', error);
    
    // Return error but don't fail completely
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Return 200 so client can handle fallback
    );
  }
}
