export async function POST(request) {
  try {
    // 1. Get the FormData from the frontend request
    const formData = await request.formData();

    // 2. Define the URL for your Python API server
    // Note: The endpoint is now /predict/
    const pythonApiUrl = `${process.env.ML_API_URL || 'http://127.0.0.1:8000'}/predict/`;
    
    // 3. Forward the FormData to your Python API
    const response = await fetch(pythonApiUrl, {
      method: 'POST',
      body: formData,
      // NOTE: Do NOT set 'Content-Type'. The browser will
      // automatically set it to 'multipart/form-data'
      // with the correct boundary.
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API server error:', errorText);
      throw new Error(`Error from Python server: ${errorText}`);
    }

    // 4. Get the JSON result from the Python API
    const result = await response.json();

    // 5. The new API returns the result directly (not nested in a 'result' key)
    // but we will wrap it for consistency with our old frontend code.
    // Check if the Python API returned an error
    if (result.error) {
      throw new Error(result.error);
    }

    // 6. Return the successful result
    return Response.json({ success: true, result: result });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}