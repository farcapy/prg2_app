SHOW USER;

SELECT table_name
  FROM user_tables
 WHERE table_name IN (
   'PRG2_USUARIOS',
   'PRG2_ALUMNOS',
   'PRG2_MATERIAS',
   'PRG2_INSCRIPCIONES'
 )
 ORDER BY table_name;

SELECT usuario, nombre, rol
  FROM prg2_usuarios;
