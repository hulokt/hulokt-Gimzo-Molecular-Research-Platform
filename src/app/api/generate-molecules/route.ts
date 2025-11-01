import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const API_KEY = process.env.NVIDIA_API_KEY || "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";
    
    const invokeUrl = 'https://health.api.nvidia.com/v1/biology/nvidia/molmim/generate';
    
    const payload = {
      algorithm: "CMA-ES",
      num_molecules: body.num_molecules,
      property_name: "QED",
      minimize: false,
      min_similarity: body.min_similarity,
      particles: body.particles,
      iterations: body.iterations,
      smi: body.smi,
    };

    const response = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `NVIDIA API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error in generate-molecules API route:", error);
    return NextResponse.json(
      { error: "Failed to generate molecules" },
      { status: 500 }
    );
  }
}

