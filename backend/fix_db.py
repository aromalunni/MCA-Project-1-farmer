import sqlite3

def fix_db():
    conn = sqlite3.connect('pmfby.db')
    c = conn.cursor()
    
    # Add is_active
    try:
        c.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
        print("Added is_active column")
    except Exception as e:
        print(f"is_active error (might exist): {e}")

    # Add updated_at
    try:
        c.execute("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        print("Added updated_at column")
    except Exception as e:
        print(f"updated_at error (might exist): {e}")

    # Add phone
    try:
        c.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        print("Added phone column")
    except Exception as e:
        print(f"phone error (might exist): {e}")

    # Add address
    try:
        c.execute("ALTER TABLE users ADD COLUMN address TEXT")
        print("Added address column")
    except Exception as e:
        print(f"address error (might exist): {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_db()
