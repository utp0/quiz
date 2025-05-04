--törlés

DROP TRIGGER valasz_bir;
DROP SEQUENCE valasz_seq;
DROP TABLE Valasz CASCADE CONSTRAINTS;

DROP TRIGGER eredmeny_bir;
DROP SEQUENCE eredmeny_seq;
DROP TABLE Eredmeny CASCADE CONSTRAINTS;

DROP TRIGGER kerdes_bir;
DROP SEQUENCE kerdes_seq;
DROP TABLE Kerdes CASCADE CONSTRAINTS;

DROP TRIGGER kviz_bir;
DROP SEQUENCE kviz_seq;
DROP TABLE Kviz CASCADE CONSTRAINTS;

DROP TRIGGER temakor_bir;
DROP SEQUENCE temakor_seq;
DROP TABLE Temakor CASCADE CONSTRAINTS;

DROP TRIGGER jatekszoba_bir;
DROP SEQUENCE jatekszoba_seq;
DROP TABLE Jatekszoba CASCADE CONSTRAINTS;

DROP TRIGGER ranglista_bir;
DROP SEQUENCE ranglista_seq;
DROP TABLE Ranglista CASCADE CONSTRAINTS;

DROP TRIGGER statisztika_bir;
DROP SEQUENCE statisztika_seq;
DROP TABLE Statisztika CASCADE CONSTRAINTS;

DROP TRIGGER felhasznalo_bir;
DROP SEQUENCE felhasznalo_seq;
DROP TABLE Felhasznalo CASCADE CONSTRAINTS;

DROP TABLE Kerdes_Temakor CASCADE CONSTRAINTS;
DROP TABLE Jatekszoba_Csatlakozas CASCADE CONSTRAINTS;

DROP TABLE LOGINLOG CASCADE CONSTRAINTS;

DROP TABLE FELHASZNALO_SZOBA_CSATLAKOZAS CASCADE CONSTRAINTS;


--tábladefiníciók

CREATE TABLE Felhasznalo (
    id NUMBER PRIMARY KEY,
    felhasznalonev VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    jelszo VARCHAR2(255) NOT NULL,
    szuletesi_ev NUMBER NOT NULL,
    jogosultsag VARCHAR2(50) DEFAULT 'felhasznalo' NOT NULL
);

CREATE TABLE Kviz (
    id NUMBER PRIMARY KEY,
    nev VARCHAR2(255) NOT NULL,
    leiras VARCHAR2(1000),
    letrehozas_datuma DATE DEFAULT SYSDATE NOT NULL,
    felhasznalo_id NUMBER NOT NULL,
    FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE
);

CREATE TABLE Statisztika (
    id NUMBER PRIMARY KEY,
    felhasznalo_id NUMBER NOT NULL,
    kviz_id NUMBER NOT NULL,
    atlagos_kitoltesi_ido NUMBER,
    helyes_valaszok_aranya NUMBER,
    FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE,
    FOREIGN KEY (kviz_id) REFERENCES Kviz(id) ON DELETE CASCADE
);

CREATE TABLE Ranglista (
    id NUMBER PRIMARY KEY,
    felhasznalo_id NUMBER NOT NULL,
    osszpontszam NUMBER DEFAULT 0 NOT NULL,
    FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE
);

CREATE TABLE Jatekszoba (
    id NUMBER PRIMARY KEY,
    nev VARCHAR2(100) NOT NULL,
    felhasznalo_id NUMBER NOT NULL,
    max_jatekos NUMBER NOT NULL,
    aktiv_allapot NUMBER(1) DEFAULT 1,
    letrehozas_datum DATE DEFAULT SYSDATE,
    kviz_id NUMBER NOT NULL,
    FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE,
    FOREIGN KEY (kviz_id) REFERENCES Kviz(id) ON DELETE CASCADE
);

CREATE TABLE Temakor (
    id NUMBER PRIMARY KEY,
    nev VARCHAR2(255) UNIQUE NOT NULL
);

CREATE TABLE Kerdes (
    id NUMBER PRIMARY KEY,
    szoveg VARCHAR2(1000) NOT NULL,
    nehezsegi_szint NUMBER,
    idokorlat NUMBER,
    kviz_id NUMBER NOT NULL,
    FOREIGN KEY (kviz_id) REFERENCES Kviz(id) ON DELETE CASCADE
);

CREATE TABLE Eredmeny (
    id NUMBER PRIMARY KEY,
    felhasznalo_id NUMBER NOT NULL,
    kviz_id NUMBER NOT NULL,
    pontszam NUMBER NOT NULL,
    idobelyeg TIMESTAMP DEFAULT SYSTIMESTAMP,
    jatekszoba_id NUMBER DEFAULT NULL,
    FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE,
    FOREIGN KEY (kviz_id) REFERENCES Kviz(id) ON DELETE CASCADE,
    FOREIGN KEY (jatekszoba_id) REFERENCES Jatekszoba(id) ON DELETE SET NULL
);

CREATE TABLE Valasz (
    id NUMBER PRIMARY KEY,
    kerdes_id NUMBER NOT NULL,
    szoveg VARCHAR2(1000) NOT NULL,
    helyes NUMBER(1) DEFAULT 0 NOT NULL,
    FOREIGN KEY (kerdes_id) REFERENCES Kerdes(id) ON DELETE CASCADE
);

CREATE TABLE Kerdes_Temakor (
    kerdes_id NUMBER NOT NULL,
    temakor_id NUMBER NOT NULL,
    FOREIGN KEY (kerdes_id) REFERENCES Kerdes(id) ON DELETE CASCADE,
    FOREIGN KEY (temakor_id) REFERENCES Temakor(id) ON DELETE CASCADE,
    CONSTRAINT pk_kerdes_temakor PRIMARY KEY (kerdes_id, temakor_id)
);

CREATE TABLE Jatekszoba_Csatlakozas (
    jatekszoba_id NUMBER NOT NULL,
    felhasznalo_id NUMBER NOT NULL,
    csatlakozas_datum DATE DEFAULT SYSDATE,
    FOREIGN KEY (jatekszoba_id) REFERENCES Jatekszoba(id) ON DELETE CASCADE,
    FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE,
    CONSTRAINT pk_jatekszoba_csatlakozas PRIMARY KEY (jatekszoba_id, felhasznalo_id)
);

CREATE TABLE LOGINLOG (
    felhasznalo_id NUMBER NOT NULL PRIMARY KEY,
	datum DATE DEFAULT SYSDATE NOT NULL,
	FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE
);

CREATE TABLE FELHASZNALO_SZOBA_CSATLAKOZAS (
    felhasznalo_id NUMBER NOT NULL PRIMARY KEY,
	datum DATE DEFAULT SYSDATE NOT NULL,
	FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id) ON DELETE CASCADE
);


-- sequencek, triggerek

CREATE SEQUENCE felhasznalo_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER felhasznalo_bir
BEFORE INSERT ON Felhasznalo
FOR EACH ROW
BEGIN
  SELECT felhasznalo_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE statisztika_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER statisztika_bir
BEFORE INSERT ON Statisztika
FOR EACH ROW
BEGIN
  SELECT statisztika_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE ranglista_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER ranglista_bir
BEFORE INSERT ON Ranglista
FOR EACH ROW
BEGIN
  SELECT ranglista_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE jatekszoba_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER jatekszoba_bir
BEFORE INSERT ON Jatekszoba
FOR EACH ROW
BEGIN
  SELECT jatekszoba_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE temakor_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER temakor_bir
BEFORE INSERT ON Temakor
FOR EACH ROW
BEGIN
  SELECT temakor_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE kviz_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER kviz_bir
BEFORE INSERT ON Kviz
FOR EACH ROW
BEGIN
  SELECT kviz_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE kerdes_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER kerdes_bir
BEFORE INSERT ON Kerdes
FOR EACH ROW
BEGIN
  SELECT kerdes_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE eredmeny_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER eredmeny_bir
BEFORE INSERT ON Eredmeny
FOR EACH ROW
BEGIN
  SELECT eredmeny_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/

CREATE SEQUENCE valasz_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER valasz_bir
BEFORE INSERT ON Valasz
FOR EACH ROW
BEGIN
  SELECT valasz_seq.NEXTVAL
  INTO :NEW.id
  FROM dual;
END;
/


CREATE OR REPLACE TRIGGER TRG_LOG_SZOBA_CSATLAKOZAS
AFTER INSERT OR UPDATE ON JATEKSZOBA_CSATLAKOZAS
FOR EACH ROW
DECLARE
  --
BEGIN
  UPDATE FELHASZNALO_SZOBA_CSATLAKOZAS
  SET datum = SYSDATE
  WHERE felhasznalo_id = :NEW.felhasznalo_id;

  IF SQL%ROWCOUNT = 0 THEN
    INSERT INTO FELHASZNALO_SZOBA_CSATLAKOZAS (felhasznalo_id, datum)
    VALUES (:NEW.felhasznalo_id, SYSDATE);
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
/



-- funkciók

CREATE OR REPLACE FUNCTION LOG_USER_LOGIN (
    p_user_id IN NUMBER
) RETURN NUMBER
IS
    PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
    UPDATE LOGINLOG
    SET datum = SYSDATE
    WHERE felhasznalo_id = p_user_id;

    IF SQL%ROWCOUNT = 0 THEN
        INSERT INTO LOGINLOG (felhasznalo_id, datum)
        VALUES (p_user_id, SYSDATE);
    END IF;

    COMMIT;

    RETURN 1;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RETURN 0;
END;
/


--példaadatok beszúrása

-- Felhasznalo tábla
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt1', 'teszt1@example.com', 'hashed_password1', 1995, 'admin');
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt2', 'teszt2@example.com', 'hashed_password2', 2000, 'felhasznalo');
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt3', 'teszt3@example.com', 'hashed_password3', 1998, 'felhasznalo');
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt4', 'teszt4@example.com', 'hashed_password4', 1992, 'admin');
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt5', 'teszt5@example.com', 'hashed_password5', 1999, 'felhasznalo');
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt6', 'teszt6@example.com', 'hashed_password6', 2001, 'felhasznalo');
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt7', 'teszt7@example.com', 'hashed_password7', 1987, 'admin');
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt8', 'teszt8@example.com', 'hashed_password8', 1994, 'felhasznalo');

-- Kviz tábla
INSERT INTO Kviz (nev, leiras, felhasznalo_id) VALUES ('Történelem kvíz', 'Egy izgalmas történelem kvíz.', 1);
INSERT INTO Kviz (nev, leiras, felhasznalo_id) VALUES ('Tudományos kvíz', 'Általános tudományos kérdések.', 4);
INSERT INTO Kviz (nev, leiras, felhasznalo_id) VALUES ('Művészet kvíz', 'Festmények, szobrok és művészek.', 7);
INSERT INTO Kviz (nev, leiras, felhasznalo_id) VALUES ('Földrajzi kvíz', 'Világ országai és városai.', 1);
INSERT INTO Kviz (nev, leiras, felhasznalo_id) VALUES ('Irodalom kvíz', 'Híres írók és művek.', 4);

-- Statisztika tábla
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (1, 1, 120, 80);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (2, 1, 150, 75);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (3, 1, 180, 85);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (4, 2, 200, 90);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (5, 2, 100, 70);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (6, 3, 130, 78);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (7, 3, 170, 88);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (8, 4, 160, 82);
INSERT INTO Statisztika (felhasznalo_id, kviz_id, atlagos_kitoltesi_ido, helyes_valaszok_aranya) VALUES (2, 5, 140, 76);

-- Ranglista tábla
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (1, 500);
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (2, 450);
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (3, 600);
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (4, 700);
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (5, 550);
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (6, 620);
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (7, 580);
INSERT INTO Ranglista (felhasznalo_id, osszpontszam) VALUES (8, 560);

-- Jatekszoba tábla
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, kviz_id) VALUES ('Történelem Szoba', 1, 10, 3);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, kviz_id) VALUES ('Tudományos Szoba', 4, 15, 3);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, kviz_id) VALUES ('Művészet Szoba', 7, 8, 3);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, kviz_id) VALUES ('Földrajz Szoba', 1, 12, 3);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, kviz_id) VALUES ('Irodalom Szoba', 4, 10, 3);

-- Temakor tábla
INSERT INTO Temakor (nev) VALUES ('Történelem');
INSERT INTO Temakor (nev) VALUES ('Tudomány');
INSERT INTO Temakor (nev) VALUES ('Művészet');
INSERT INTO Temakor (nev) VALUES ('Földrajz');
INSERT INTO Temakor (nev) VALUES ('Irodalom');

-- Kerdes tábla
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Mikor volt az első világháború?', 2, 30, 1);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki fedezte fel a gravitációt?', 2, 30, 2);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki festette a Mona Lisát?', 2, 25, 3);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Mi a fővárosa Kanadának?', 1, 20, 4);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki írta a Rómeó és Júliát?', 2, 25, 5);

-- Eredmeny tábla
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (1, 1, 80);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (2, 1, 75);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (3, 1, 85);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (4, 2, 90);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (5, 2, 70);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (6, 3, 78);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (7, 3, 88);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (8, 4, 82);
INSERT INTO Eredmeny (felhasznalo_id, kviz_id, pontszam) VALUES (2, 5, 76);

-- Valasz tábla
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1914-1918', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1939-1945', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1870-1914', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1900-1914', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'Newton', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'Einstein', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'Galileo', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'Kepler', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, 'Leonardo da Vinci', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, 'Pablo Picasso', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, 'Vincent van Gogh', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, 'Claude Monet', 0);

-- Kerdes_Temakor kapcsoló tábla
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (1, 1);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (2, 2);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (3, 3);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (4, 4);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (5, 5);

-- Jatekszoba_Csatlakozas tábla
INSERT INTO Jatekszoba_Csatlakozas (jatekszoba_id, felhasznalo_id) VALUES (1, 2);
INSERT INTO Jatekszoba_Csatlakozas (jatekszoba_id, felhasznalo_id) VALUES (1, 3);
INSERT INTO Jatekszoba_Csatlakozas (jatekszoba_id, felhasznalo_id) VALUES (2, 4);
INSERT INTO Jatekszoba_Csatlakozas (jatekszoba_id, felhasznalo_id) VALUES (3, 5);
INSERT INTO Jatekszoba_Csatlakozas (jatekszoba_id, felhasznalo_id) VALUES (3, 6);
INSERT INTO Jatekszoba_Csatlakozas (jatekszoba_id, felhasznalo_id) VALUES (4, 7);
INSERT INTO Jatekszoba_Csatlakozas (jatekszoba_id, felhasznalo_id) VALUES (5, 8);
