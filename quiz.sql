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

DROP TRIGGER trg_kviz_befejezes_log;
DROP TABLE Kviz_Befejezes_Log CASCADE CONSTRAINTS;

DROP SEQUENCE hiba_naplo_seq;
DROP PROCEDURE NAPLOZO_HIBA;
DROP TABLE HIBA_NAPLO;

DROP TRIGGER trg_kviz_letrehozas;
DROP TABLE Kviz_Letrehozas_Log CASCADE CONSTRAINTS;

DROP TRIGGER trg_kerdes_letrehozas;
DROP TABLE Kerdes_Letrehozas_Log CASCADE CONSTRAINTS;


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

CREATE TABLE HIBA_NAPLO (
    id NUMBER PRIMARY KEY,
    idopont TIMESTAMP DEFAULT SYSTIMESTAMP,
    hiba_uzenet VARCHAR2(4000),
    hiba_kod VARCHAR2(100),
    fuggveny_nev VARCHAR2(100),
    felhasznalo_id NUMBER,
    egyeb_info VARCHAR2(1000)
);

CREATE TABLE Kviz_Befejezes_Log (
    id NUMBER PRIMARY KEY,
    felhasznalo_id NUMBER NOT NULL,
    kviz_id NUMBER NOT NULL,
    pontszam NUMBER NOT NULL,
    jatekszoba_id NUMBER,
    idobelyeg TIMESTAMP DEFAULT SYSTIMESTAMP,
    
    FOREIGN KEY (felhasznalo_id) REFERENCES Felhasznalo(id),
    FOREIGN KEY (kviz_id) REFERENCES Kviz(id),
    FOREIGN KEY (jatekszoba_id) REFERENCES Jatekszoba(id)
);

CREATE TABLE Kviz_Letrehozas_Log (
    id NUMBER PRIMARY KEY,
    kviz_id NUMBER NOT NULL,
    nev VARCHAR2(255),
    letrehozas_ideje TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE Kerdes_Letrehozas_Log (
    id NUMBER PRIMARY KEY,
    kerdes_id NUMBER NOT NULL,
    szoveg VARCHAR2(1000),
    idobelyeg TIMESTAMP DEFAULT SYSTIMESTAMP
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

CREATE OR REPLACE TRIGGER trg_kviz_befejezes_log
AFTER INSERT ON Eredmeny
FOR EACH ROW
BEGIN
    INSERT INTO Kviz_Befejezes_Log (id, felhasznalo_id, kviz_id, pontszam, jatekszoba_id, idobelyeg)
    VALUES (
        (SELECT NVL(MAX(ID), 1)+1 FROM Kviz_Befejezes_Log),
        :NEW.felhasznalo_id, 
        :NEW.kviz_id, 
        :NEW.pontszam, 
        :NEW.jatekszoba_id, 
        :NEW.idobelyeg
    );
END;
/

CREATE OR REPLACE TRIGGER trg_kviz_letrehozas
AFTER INSERT ON Kviz
FOR EACH ROW
BEGIN
    INSERT INTO Kviz_Letrehozas_Log (id, kviz_id, nev)
    VALUES (
        (SELECT NVL(MAX(ID), 1)+1 FROM Kviz_Letrehozas_Log),
        :NEW.id, 
        :NEW.nev
    );
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

-- kikapcs, insert-nél van MAX(ID)+1 inkább
ALTER TRIGGER kviz_bir DISABLE;

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

CREATE SEQUENCE hiba_naplo_seq 
START WITH 1 
INCREMENT BY 1;


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

CREATE OR REPLACE TRIGGER trg_kerdes_letrehozas
AFTER INSERT ON Kerdes
FOR EACH ROW
BEGIN
    INSERT INTO Kerdes_Letrehozas_Log (id, kerdes_id, szoveg)
    VALUES ((SELECT NVL(MAX(ID), 1)+1 FROM kerdes_letrehozas_log), :NEW.id, :NEW.szoveg);
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

CREATE OR REPLACE PROCEDURE NAPLOZO_HIBA(
    p_hiba_uzenet IN VARCHAR2,
    p_hiba_kod IN VARCHAR2 DEFAULT NULL,
    p_fuggveny_nev IN VARCHAR2 DEFAULT NULL,
    p_felhasznalo_id IN NUMBER DEFAULT NULL,
    p_egyeb_info IN VARCHAR2 DEFAULT NULL
) AS
    PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
    INSERT INTO HIBA_NAPLO (id, idopont, hiba_uzenet, hiba_kod, fuggveny_nev, felhasznalo_id, egyeb_info)
    VALUES (hiba_naplo_seq.NEXTVAL, SYSTIMESTAMP, p_hiba_uzenet, p_hiba_kod, p_fuggveny_nev, p_felhasznalo_id, p_egyeb_info);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Hibanaplózási hiba: ' || SQLERRM);
        ROLLBACK;
END;
/


-- Példaadatok beszúrása

-- Felhasznalo tábla (10 felhasználó)
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('admin', 'admin@quiz.hu', '$2b$10$i6bQyf3R.1YMb8DS3qwfLe0upfzAgQXBwaw8RbQJaCUZJQEBZ6LQy', 1990, 'admin');  -- admin123
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('tanar2', 'tanar1@quiz.hu', '$2b$10$atvZXh4uPml1alkaD75PI.tGQHCcaDF37AmzcnhxKkiynBchhQRDS', 1985, 'admin');  -- tanar123
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('diák1', 'diak1@quiz.hu', '$2b$10$5rvuHgGHhvmqqsdksuoa.eaxW0PqSyr9hQYgIpeCNprv2Yyl0qAAO', 2000, 'felhasznalo');  -- diak123
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('diák2', 'diak2@quiz.hu', '$2b$10$XSP7y75NFXLzv5.XA0/eB.QtboYeCu6a.F2GtEGUM09CKVLZnLJ5m', 2001, 'felhasznalo');  -- asd
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('kvízmester', 'kvizmester@quiz.hu', '$2b$10$XSP7y75NFXLzv5.XA0/eB.QtboYeCu6a.F2GtEGUM09CKVLZnLJ5m', 1992, 'admin');  -- asd
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('jatekos1', 'jatekos1@gmail.com', '$2b$10$SefawZwpzgz7ImFdLS8U4OruZWzYBFbt3qiwhAOIJIqg6A8kvOj4K', 1995, 'felhasznalo');  -- jelszo456
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('jatekos2', 'jatekos2@gmail.com', '$2b$10$XSP7y75NFXLzv5.XA0/eB.QtboYeCu6a.F2GtEGUM09CKVLZnLJ5m', 1998, 'felhasznalo');  -- asd
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('oktatási_szakértő', 'oktato@quiz.hu', '$2b$10$XSP7y75NFXLzv5.XA0/eB.QtboYeCu6a.F2GtEGUM09CKVLZnLJ5m', 1980, 'admin');  -- asd
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('vendég', 'vendeg@gmail.com', '$2b$10$XSP7y75NFXLzv5.XA0/eB.QtboYeCu6a.F2GtEGUM09CKVLZnLJ5m', 2002, 'felhasznalo');  -- asd
INSERT INTO Felhasznalo (felhasznalonev, email, jelszo, szuletesi_ev, jogosultsag) VALUES ('teszt_user', 'teszt@quiz.hu', '$2b$10$XSP7y75NFXLzv5.XA0/eB.QtboYeCu6a.F2GtEGUM09CKVLZnLJ5m', 1997, 'felhasznalo');  -- asd

-- Temakor tábla (10 témakör)
INSERT INTO Temakor (nev) VALUES ('Történelem');
INSERT INTO Temakor (nev) VALUES ('Matematika');
INSERT INTO Temakor (nev) VALUES ('Irodalom');
INSERT INTO Temakor (nev) VALUES ('Földrajz');
INSERT INTO Temakor (nev) VALUES ('Biológia');
INSERT INTO Temakor (nev) VALUES ('Informatika');
INSERT INTO Temakor (nev) VALUES ('Fizika');
INSERT INTO Temakor (nev) VALUES ('Kémia');
INSERT INTO Temakor (nev) VALUES ('Művészet');
INSERT INTO Temakor (nev) VALUES ('Sport');

-- Kviz tábla (8 kvíz)
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES (NVL((SELECT MAX(ID)+1 FROM KVIZ), 1), 'Történelmi alapok', 'Alap történelmi ismereteket mérő kvíz.', TO_DATE('2023-01-15', 'YYYY-MM-DD'), 1);
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES ((SELECT MAX(ID)+1 FROM Kviz), 'Matematikai kihívás', 'Középszintű matematikai feladatok.', TO_DATE('2023-02-10', 'YYYY-MM-DD'), 2);
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES ((SELECT MAX(ID)+1 FROM Kviz), 'Irodalmi barangolás', 'Magyar és világirodalmi kérdések.', TO_DATE('2023-03-05', 'YYYY-MM-DD'), 5);
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES ((SELECT MAX(ID)+1 FROM Kviz), 'Földrajzi felfedezések', 'Utazz velünk a világban!', TO_DATE('2023-04-20', 'YYYY-MM-DD'), 8);
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES ((SELECT MAX(ID)+1 FROM Kviz), 'IT szakértő', 'Informatikai alapismeretek tesztelése.', TO_DATE('2023-05-12', 'YYYY-MM-DD'), 1);
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES ((SELECT MAX(ID)+1 FROM Kviz), 'Biológiai sokszínűség', 'Az élővilág csodái.', TO_DATE('2023-06-08', 'YYYY-MM-DD'), 2);
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES ((SELECT MAX(ID)+1 FROM Kviz), 'Művészeti stílusok', 'Művészettörténeti kvíz.', TO_DATE('2023-07-22', 'YYYY-MM-DD'), 8);
INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id) VALUES ((SELECT MAX(ID)+1 FROM Kviz), 'Sporttörténet', 'Érdekességek a sport világából.', TO_DATE('2023-08-15', 'YYYY-MM-DD'), 5);
COMMIT;
SET DEFINE OFF;
DELETE FROM KVIZ WHERE ID = 99999 OR NEV = '-- kategorizálatlan --';
COMMIT;
Insert into KVIZ (ID,NEV,LEIRAS,LETREHOZAS_DATUMA,FELHASZNALO_ID) values (99999,'-- kategorizálatlan --',null,TO_DATE('2025-05-16', 'YYYY-MM-DD'),1);
COMMIT;
UPDATE KVIZ SET ID = 99999 WHERE NEV = '-- kategorizálatlan --';
COMMIT;
SET DEFINE ON;

-- Kerdes tábla (24 kérdés - kvízenként 3 kérdés)
-- Történelmi alapok kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik évben volt a mohácsi csata?', 2, 30, 1);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki volt Magyarország első királya?', 1, 20, 1);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik évben tört ki az 1848-as forradalom Magyarországon?', 2, 30, 1);

-- Matematikai kihívás kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Mennyi 5! (5 faktoriális) értéke?', 2, 40, 2);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Mi a Pitagorasz-tétel?', 2, 45, 2);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ha x² + 4x + 4 = 0, mennyi x értéke?', 3, 60, 2);

-- Irodalmi barangolás kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki írta Az ember tragédiája című művet?', 1, 20, 3);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik Shakespeare-dráma főszereplője Hamlet?', 1, 25, 3);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki írta a Nemecsek karaktert tartalmazó regényt?', 2, 30, 3);

-- Földrajzi felfedezések kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik a Föld legmagasabb hegycsúcsa?', 1, 20, 4);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik tenger választja el Európát Afrikától?', 1, 25, 4);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik a világ legnépesebb országa?', 1, 20, 4);

-- IT szakértő kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Mit jelent a HTML rövidítés?', 1, 30, 5);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Mi a SQL elsődleges felhasználási területe?', 2, 40, 5);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik nem programozási nyelv az alábbiak közül?', 1, 25, 5);

-- Biológiai sokszínűség kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Milyen sejtalkotó tartalmazza a DNS-t?', 2, 30, 6);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Mi a fotoszintézis alapanyaga?', 2, 35, 6);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik nem tartozik az emlősök közé?', 1, 20, 6);

-- Művészeti stílusok kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki festette a Mona Lisa-t?', 1, 20, 7);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik művészeti stílus jellemző a 17. századra?', 2, 30, 7);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Ki volt Salvador Dalí?', 1, 25, 7);

-- Sporttörténet kvíz kérdései
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik évben rendezték az első újkori olimpiai játékokat?', 2, 30, 8);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Hány játékos van egy futballcsapatban a pályán?', 1, 15, 8);
INSERT INTO Kerdes (szoveg, nehezsegi_szint, idokorlat, kviz_id) VALUES ('Melyik sportban használnak tollaslabdát?', 1, 15, 8);

-- Valasz tábla (96 válasz - minden kérdéshez 4 válasz)
-- Történelmi alapok kvíz válaszai
-- 1. kérdés (Mohácsi csata)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1526', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1456', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1686', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (1, '1541', 0);

-- 2. kérdés (Első király)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'Szent István', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'Szent László', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'Könyves Kálmán', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (2, 'IV. Béla', 0);

-- 3. kérdés (1848-as forradalom)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, '1848', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, '1956', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, '1867', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (3, '1703', 0);

-- Matematikai kihívás kvíz válaszai
-- 4. kérdés (5 faktoriális)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (4, '120', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (4, '24', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (4, '720', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (4, '120', 1);

-- 5. kérdés (Pitagorasz-tétel)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (5, 'a² + b² = c²', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (5, 'a + b = c', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (5, 'a * b = c', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (5, 'a / b = c', 0);

-- 6. kérdés (Egyenlet)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (6, '-2', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (6, '2', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (6, '4', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (6, '-4', 0);

-- Irodalmi barangolás kvíz válaszai
-- 7. kérdés (Az ember tragédiája)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (7, 'Madách Imre', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (7, 'Petőfi Sándor', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (7, 'Arany János', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (7, 'Jókai Mór', 0);

-- 8. kérdés (Hamlet)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (8, 'Hamlet', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (8, 'Macbeth', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (8, 'Rómeó és Júlia', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (8, 'Othello', 0);

-- 9. kérdés (Nemecsek)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (9, 'Molnár Ferenc', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (9, 'Jókai Mór', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (9, 'Gárdonyi Géza', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (9, 'Móricz Zsigmond', 0);

-- Földrajzi felfedezések kvíz válaszai
-- 10. kérdés (Legmagasabb hegycsúcs)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (10, 'Mount Everest', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (10, 'K2', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (10, 'Mont Blanc', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (10, 'Kilimandzsáró', 0);

-- 11. kérdés (Tenger Európa és Afrika között)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (11, 'Földközi-tenger', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (11, 'Fekete-tenger', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (11, 'Vörös-tenger', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (11, 'Balti-tenger', 0);

-- 12. kérdés (Legnépesebb ország)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (12, 'Kína', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (12, 'India', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (12, 'Egyesült Államok', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (12, 'Brazília', 0);

-- IT szakértő kvíz válaszai
-- 13. kérdés (HTML jelentése)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (13, 'HyperText Markup Language', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (13, 'High Technology Modern Language', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (13, 'Hyper Transfer Machine Learning', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (13, 'Home Tool Markup Language', 0);

-- 14. kérdés (SQL felhasználás)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (14, 'Adatbázis-kezelés', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (14, 'Webdesign', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (14, 'Hálózati protokoll', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (14, 'Képszerkesztés', 0);

-- 15. kérdés (Nem programozási nyelv)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (15, 'HTML', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (15, 'Python', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (15, 'Java', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (15, 'C++', 0);

-- Biológiai sokszínűség kvíz válaszai
-- 16. kérdés (DNS tartalmazó sejtalkotó)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (16, 'Sejtmag', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (16, 'Golgi-készülék', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (16, 'Riboszóma', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (16, 'Endoplazmatikus retikulum', 0);

-- 17. kérdés (Fotoszintézis alapanyaga)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (17, 'Szén-dioxid és víz', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (17, 'Oxigén és glükóz', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (17, 'Nitrogén és hidrogén', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (17, 'Hidrogén és oxigén', 0);

-- 18. kérdés (Nem emlős)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (18, 'Krokodil', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (18, 'Delfin', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (18, 'Denevér', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (18, 'Bálna', 0);

-- Művészeti stílusok kvíz válaszai
-- 19. kérdés (Mona Lisa)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (19, 'Leonardo da Vinci', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (19, 'Michelangelo', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (19, 'Raffaello', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (19, 'Botticelli', 0);

-- 20. kérdés (17. századi művészeti stílus)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (20, 'Barokk', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (20, 'Reneszánsz', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (20, 'Klasszicizmus', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (20, 'Romantika', 0);

-- 21. kérdés (Salvador Dalí)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (21, 'Szürrealista festő', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (21, 'Impresszionista zeneszerző', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (21, 'Reneszánsz szobrász', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (21, 'Romantikus költő', 0);

-- Sporttörténet kvíz válaszai
-- 22. kérdés (Első újkori olimpia)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (22, '1896', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (22, '1900', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (22, '1924', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (22, '1936', 0);

-- 23. kérdés (Futballcsapat létszáma)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (23, '11', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (23, '10', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (23, '12', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (23, '9', 0);

-- 24. kérdés (Tollaslabda)
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (24, 'Tollaslabda', 1);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (24, 'Asztalitenisz', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (24, 'Tenisz', 0);
INSERT INTO Valasz (kerdes_id, szoveg, helyes) VALUES (24, 'Squash', 0);

-- Kerdes_Temakor kapcsoló tábla (témakörök hozzárendelése kérdésekhez)
-- Történelmi alapok kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (1, 1);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (2, 1);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (3, 1);

-- Matematikai kihívás kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (4, 2);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (5, 2);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (6, 2);

-- Irodalmi barangolás kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (7, 3);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (8, 3);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (9, 3);

-- Földrajzi felfedezések kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (10, 4);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (11, 4);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (12, 4);

-- IT szakértő kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (13, 6);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (14, 6);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (15, 6);

-- Biológiai sokszínűség kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (16, 5);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (17, 5);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (18, 5);

-- Művészeti stílusok kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (19, 9);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (20, 9);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (21, 9);

-- Sporttörténet kvíz kérdéseinek témái
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (22, 10);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (23, 10);
INSERT INTO Kerdes_Temakor (kerdes_id, temakor_id) VALUES (24, 10);

-- Jatekszoba tábla (5 játékszoba)
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, aktiv_allapot, letrehozas_datum, kviz_id) VALUES ('Történelem rajongók', 1, 10, 1, TO_DATE('2023-09-01', 'YYYY-MM-DD'), 1);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, aktiv_allapot, letrehozas_datum, kviz_id) VALUES ('Matek bajnokok', 2, 8, 1, TO_DATE('2023-09-05', 'YYYY-MM-DD'), 2);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, aktiv_allapot, letrehozas_datum, kviz_id) VALUES ('Irodalom kedvelők', 5, 12, 1, TO_DATE('2023-09-10', 'YYYY-MM-DD'), 3);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, aktiv_allapot, letrehozas_datum, kviz_id) VALUES ('IT Szakik', 1, 6, 1, TO_DATE('2023-09-15', 'YYYY-MM-DD'), 5);
INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, aktiv_allapot, letrehozas_datum, kviz_id) VALUES ('Sport fanatikusok', 5, 10, 1, TO_DATE('2023-09-20', 'YYYY-MM-DD'), 8);

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


COMMIT;