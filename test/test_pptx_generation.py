
import os
from app.services.presentation_service import presentation_service

# Mock Slide Data (Output of structure_content)
mock_slides = {
    "slides": [
        {
            "type": "title",
            "title": "EcoFit Brand Strategy",
            "subtitle": "Sustainable Performance"
        },
        {
            "type": "content",
            "title": "The Problem",
            "content": [
                "Plastic waste is destroying oceans.",
                "Gym wear wears out too fast.",
                "Consumers feel guilty."
            ]
        }
    ]
}

def test_pptx():
    print("--- Testing PPTX Generation ---")
    output_file = "test_presentation.pptx"
    
    # Clean up previous run
    if os.path.exists(output_file):
        os.remove(output_file)
        
    path = presentation_service.generate_pptx(mock_slides, output_file)
    
    if path and os.path.exists(path):
        print(f"SUCCESS: File created at {path}")
        print(f"File Size: {os.path.getsize(path)} bytes")
    else:
        print("FAILURE: File not created.")

if __name__ == "__main__":
    test_pptx()
