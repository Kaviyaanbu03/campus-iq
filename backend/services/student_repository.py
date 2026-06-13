"""
CampusIQ X - Student Data Repository
----------------------------------------
Loads the synthetic student dataset and exposes simple in-memory
CRUD/query operations. In production this would be swapped for an
Azure Cosmos DB repository (see `cosmos_repository.py` for the
interface this mirrors), without changing any agent or API code -
this is the Repository Pattern in action.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from models.schemas import Student

_DATA_PATH = Path(__file__).resolve().parent.parent / "synthetic_data" / "students.json"


class StudentRepository:
    def __init__(self, data_path: Path = _DATA_PATH) -> None:
        self._data_path = data_path
        self._students: List[Student] = []
        self._load()

    def _load(self) -> None:
        with open(self._data_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        self._students = [Student(**item) for item in raw]

    def reload(self) -> None:
        self._load()

    def list_all(self) -> List[Student]:
        return self._students

    def get_by_id(self, student_id: str) -> Optional[Student]:
        for s in self._students:
            if s.student_id.lower() == student_id.lower():
                return s
        return None

    def count(self) -> int:
        return len(self._students)


# Singleton repository instance
student_repository = StudentRepository()
