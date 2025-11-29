"""
Database setup and operations for pgvector.
"""

import psycopg2
import os
from typing import List, Tuple, Optional


class BuildingDB:
    """PostgreSQL database with pgvector for building embeddings."""
    
    def __init__(self):
        """
        Initialize database connection
        """

        self.conn_str = os.environ["DATABASE_URL"]
        
        if not self.conn_str:
            raise ValueError(
                "DATABASE_URL environment variable not found. "
                "Make sure your .env file exists and contains DATABASE_URL"
            )


    def insert_image(self, name: str, embedding: List[float], 
                       description: Optional[str] = None,
                       image_path: Optional[str] = None):
        """
        Insert an image with its embedding.
        Args:
            name: Building name
            embedding: Embedding vector (list of floats)
            description: Optional building description
            image_path: Optional path to reference image
        """
        conn = psycopg2.connect(self.conn_str)
        cur = conn.cursor()
        
        try:
            cur.execute("""
                INSERT INTO buildings (name, embedding, description, image_path)
                VALUES (%s, %s::vector, %s, %s)
            """, (name, str(embedding), description, image_path))
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise
        finally:
            cur.close()
            conn.close()

    def search_similar(self, embedding: List[float], limit: int = 5, 
                      threshold: float = 0.7) -> List[dict]:
        """
        Search for similar buildings using cosine similarity.
        
        Args:
            embedding: Query embedding vector
            limit: Maximum number of results
            threshold: Minimum similarity threshold (0-1)
            
        Returns:
            List of dictionaries with building info and similarity score
        """
        conn = psycopg2.connect(self.conn_str)
        cur = conn.cursor()
        
        try:
            # Use cosine distance (1 - cosine similarity)
            # Lower distance = higher similarity
            cur.execute("""
                SELECT 
                    name,
                    description,
                    image_path,
                    1 - (embedding <=> %s::vector) as similarity
                FROM buildings
                WHERE 1 - (embedding <=> %s::vector) >= %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (str(embedding), str(embedding), threshold, str(embedding), limit))
            
            results = []
            for row in cur.fetchall():
                results.append({
                    "name": row[0],
                    "description": row[1],
                    "image_path": row[2],
                    "similarity": float(row[3])
                })
            
            return results
            
        except Exception as e:
            raise
        finally:
            cur.close()
            conn.close()
    
    def get_all_buildings(self) -> List[dict]:
        """Get all buildings from database."""
        conn = psycopg2.connect(self.conn_str)
        cur = conn.cursor()
        
        try:
            cur.execute("SELECT id, name, description, image_path FROM buildings")
            
            results = []
            for row in cur.fetchall():
                results.append({
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "image_path": row[3]
                })
            
            return results
            
        finally:
            cur.close()
            conn.close()
    
    def clear_buildings(self):
        """Clear all buildings from database."""
        conn = psycopg2.connect(self.conn_str)
        cur = conn.cursor()
        
        try:
            cur.execute("TRUNCATE TABLE buildings")
            conn.commit()
            print("✅ Cleared all buildings")
        finally:
            cur.close()
            conn.close()

