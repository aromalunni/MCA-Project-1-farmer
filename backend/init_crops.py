import sqlite3

conn = sqlite3.connect("pmfby.db")
cursor = conn.cursor()

# Delete existing crops
cursor.execute("DELETE FROM crops")

# Insert Kerala-specific crop data
crops = [
    ("Rice (Paddy)", "RICE01", "kharif", 30000, 150000),
    ("Coconut", "COCO01", "kharif", 50000, 300000),
    ("Rubber", "RUBB01", "kharif", 75000, 400000),
    ("Banana (Nendran)", "BANA01", "summer", 25000, 100000),
    ("Pepper (Black)", "PEPP01", "kharif", 40000, 200000),
    ("Cardamom", "CARD01", "kharif", 60000, 250000),
]

for crop_name, crop_code, season, min_amount, max_amount in crops:
    cursor.execute(
        "INSERT INTO crops (crop_name, crop_code, season, min_cover_amount, max_cover_amount) VALUES (?, ?, ?, ?, ?)",
        (crop_name, crop_code, season, min_amount, max_amount)
    )

conn.commit()
conn.close()
print("✅ Kerala crops inserted successfully!")
