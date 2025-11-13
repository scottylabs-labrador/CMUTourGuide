"""
CLIP-based building recognizer for CMU Tour Guide.
CLIP is chosen for high accuracy with minimal training data requirements.
"""
import torch
import clip
from PIL import Image
import numpy as np
import ssl
import urllib.request

# Fix for SSL certificate issues on macOS
ssl._create_default_https_context = ssl._create_unverified_context

class BuildingRecognizer:
    """CLIP-based image encoder for building recognition."""
    
    def __init__(self, model_name="ViT-B/32", device=None):
        """
        Initialize CLIP model.
        
        Args:
            model_name: CLIP model variant (ViT-B/32 is a good balance)
            device: torch device (auto-detected if None)
        """
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = device
            
        self.model, self.preprocess = clip.load(model_name, device=self.device)
        self.model.eval()
        
    def encode_image(self, image_path):
        """
        Encode an image into a normalized embedding vector.
        
        Args:
            image_path: Path to image file or PIL Image object
            
        Returns:
            Normalized embedding vector as numpy array
        """
        if isinstance(image_path, str):
            image = Image.open(image_path).convert("RGB")
        else:
            image = image_path.convert("RGB")
            
        image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            # Get image features from CLIP
            image_features = self.model.encode_image(image_tensor)
            # Normalize to unit vector for cosine similarity
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
        return image_features.cpu().numpy().squeeze()
    
    def encode_image_batch(self, image_paths):
        """
        Encode multiple images efficiently.
        
        Args:
            image_paths: List of image paths or PIL Image objects
            
        Returns:
            Numpy array of normalized embeddings (N, embedding_dim)
        """
        images = []
        for img_path in image_paths:
            if isinstance(img_path, str):
                image = Image.open(img_path).convert("RGB")
            else:
                image = img_path.convert("RGB")
            images.append(self.preprocess(image))
        
        image_tensor = torch.stack(images).to(self.device)
        
        with torch.no_grad():
            image_features = self.model.encode_image(image_tensor)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
        return image_features.cpu().numpy()
