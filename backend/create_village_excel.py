#!/usr/bin/env python
"""Generate Village_Master_Sangli_Kolhapur.xlsx with sample data"""
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

# Hardcoded data from geography.py
TALUKAS_BY_DISTRICT = {
    "Kolhapur": [
        "Karveer",
        "Panhala",
        "Hatkanangale",
        "Shirol",
        "Kagal",
        "Gadhinglaj",
        "Chandgad",
        "Ajara",
        "Bhudargad",
        "Radhanagari",
        "Gaganbawda",
        "Shahuwadi",
    ],
    "Sangli": [
        "Miraj",
        "Walwa (Islampur)",
        "Tasgaon",
        "Khanapur-Vita",
        "Kavathe Mahankal",
        "Jat",
        "Shirala",
        "Palus",
        "Atpadi",
        "Kadegaon",
    ],
}

# Sample villages for each taluka (you should replace with actual village names)
VILLAGES = {
    "Karveer": ["Phaltan", "Navapur", "Panchgani"],
    "Panhala": ["Panhala", "Karewadi", "Bhayli"],
    "Hatkanangale": ["Hatkanangale", "Andharwahan", "Savlat"],
    "Shirol": ["Shirol", "Sonkamble", "Konde"],
    "Kagal": ["Kagal", "Borghata", "Savade"],
    "Gadhinglaj": ["Gadhinglaj", "Warnali", "Chandoli"],
    "Chandgad": ["Chandgad", "Adsul", "Rajas"],
    "Ajara": ["Ajara", "Hirewadi", "Kudal"],
    "Bhudargad": ["Bhudargad", "Amboli", "Kolhar"],
    "Radhanagari": ["Radhanagari", "Halkarni", "Balekundri"],
    "Gaganbawda": ["Gaganbawda", "Bahirwadi", "Girye"],
    "Shahuwadi": ["Shahuwadi", "Murgud", "Londa"],
    "Miraj": ["Miraj", "Mirajgaon", "Londa Junction"],
    "Walwa (Islampur)": ["Walwa", "Islampur", "Andharwahan"],
    "Tasgaon": ["Tasgaon", "Vishalkaradak", "Valoj"],
    "Khanapur-Vita": ["Khanapur", "Vita", "Sangli Miraj"],
    "Kavathe Mahankal": ["Kavathe Mahankal", "Shirala", "Kanaje"],
    "Jat": ["Jat", "Vavdi", "Shelgaon"],
    "Shirala": ["Shirala", "Nandgaon", "Indavaldhi"],
    "Palus": ["Palus", "Karad", "Tonda"],
    "Atpadi": ["Atpadi", "Bijapur", "Dudhani"],
    "Kadegaon": ["Kadegaon", "Kandhar", "Mahagaon"],
}

wb = Workbook()
ws = wb.active
ws.title = "Villages"

# Add header
header = ["District", "Taluka", "Village"]
ws.append(header)

# Style header
header_fill = PatternFill(start_color="4058FF", end_color="4058FF", fill_type="solid")
header_font = Font(bold=True, color="FFFFFF")
for cell in ws[1]:
    cell.fill = header_fill
    cell.font = header_font

# Add data
row_count = 0
for district, talukas in TALUKAS_BY_DISTRICT.items():
    for taluka in talukas:
        villages = VILLAGES.get(taluka, [taluka])
        for village in villages:
            ws.append([district, taluka, village])
            row_count += 1

# Adjust column widths
ws.column_dimensions['A'].width = 15
ws.column_dimensions['B'].width = 20
ws.column_dimensions['C'].width = 25

# Save file
output_path = Path("data/Village_Master_Sangli_Kolhapur.xlsx")
output_path.parent.mkdir(parents=True, exist_ok=True)
wb.save(str(output_path))
print(f"✓ Excel file created: {output_path.absolute()}")
print(f"✓ Total village records: {row_count}")
