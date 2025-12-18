import { AppDataSource } from '../data-source';
import { ChangeHistory } from '../entities/ChangeHistory';
import { Student } from '../entities/Student';

export async function logStudentChanges(
  student: Student,
  newData: Partial<Student>,
  changedBy: string
) {
  const historyRepo = AppDataSource.getRepository(ChangeHistory);
  const changes: ChangeHistory[] = [];

  // Fields to track
  const fields: (keyof Student)[] = [
    'name', 
    'major', 
    'grade', 
    'contactPhone', 
    'contactEmail', 
    'emergencyContact', 
    'address', 
    'gender', 
    'idCard'
  ];

  for (const field of fields) {
    // If the field is not in newData, it means it wasn't updated (or at least not sent)
    // However, if we pass the whole body, we need to check if it's actually defined
    if (newData[field] === undefined) continue;

    const oldValue = student[field] === null || student[field] === undefined ? '' : String(student[field]);
    const newValue = newData[field] === null || newData[field] === undefined ? '' : String(newData[field]);

    if (oldValue !== newValue) {
      const history = historyRepo.create({
        student,
        field,
        oldValue,
        newValue,
        changedBy
      });
      changes.push(history);
    }
  }

  if (changes.length > 0) {
    await historyRepo.save(changes);
  }
}
