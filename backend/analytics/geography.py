from __future__ import annotations

from typing import Any


DISTRICTS = ["Kolhapur", "Sangli"]

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

ALL_TALUKAS = [
    taluka for district in DISTRICTS for taluka in TALUKAS_BY_DISTRICT[district]
]

TALUKA_DISTRICT = {
    taluka: district
    for district, talukas in TALUKAS_BY_DISTRICT.items()
    for taluka in talukas
}


def _clean(value: Any) -> str:
    if isinstance(value, list):
        value = value[0] if value else ""
    if value is None:
        return ""
    return str(value).strip()


def _key(value: Any) -> str:
    return "".join(char for char in _clean(value).lower() if char.isalnum())


def canonical_district(value: Any) -> str:
    source = _clean(value)
    source_key = _key(source)
    if not source_key:
        return ""

    for district in DISTRICTS:
        district_key = _key(district)
        if source_key == district_key or district_key in source_key:
            return district
    return ""


def canonical_taluka(value: Any, district: str = "") -> str:
    source_key = _key(value)
    if not source_key:
        return ""

    for taluka in ALL_TALUKAS:
        taluka_key = _key(taluka)
        if source_key == taluka_key or taluka_key in source_key:
            if district and TALUKA_DISTRICT[taluka] != district:
                return ""
            return taluka
    return ""


def taluka_options_metadata() -> dict[str, list[str]]:
    return {district: list(talukas) for district, talukas in TALUKAS_BY_DISTRICT.items()}
