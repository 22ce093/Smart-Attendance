const normalizeDepartmentName = (value = '') =>
  String(value)
    .trim()
    .replace(/\s+/g, ' ');

const equalDepartmentNames = (left, right) =>
  normalizeDepartmentName(left).toLowerCase() === normalizeDepartmentName(right).toLowerCase();

const resolveDepartmentValue = (inputDepartment, availableDepartments = []) => {
  const normalizedInput = normalizeDepartmentName(inputDepartment);
  if (!normalizedInput) {
    return '';
  }

  const matchedDepartment = availableDepartments.find((department) =>
    equalDepartmentNames(department, normalizedInput)
  );

  return matchedDepartment || normalizedInput;
};

const dedupeDepartments = (departments = []) => {
  const uniqueDepartments = [];

  for (const department of departments) {
    const normalized = normalizeDepartmentName(department);
    if (!normalized) {
      continue;
    }

    if (!uniqueDepartments.some((item) => equalDepartmentNames(item, normalized))) {
      uniqueDepartments.push(normalized);
    }
  }

  return uniqueDepartments.sort((left, right) => left.localeCompare(right));
};

module.exports = {
  dedupeDepartments,
  equalDepartmentNames,
  normalizeDepartmentName,
  resolveDepartmentValue
};
