/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { formatDate, formatStatus } from "../app/format.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test("Then clicking on the 'New Bill' button should redirect to NewBill page", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      ); // identifié comme employé
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills); // construction de la page et navigation jusqu'à la bonne page

      await waitFor(() => screen.getByTestId("btn-new-bill")); // attendre que le bouton soit disponible
      const bills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      }); // nouvelle instance de Bills
      const handleClickNewBill = jest.fn(bills.handleClickNewBill); // récupération de la fonction handleClickNewBill
      const newBillButton = screen.getByTestId("btn-new-bill");
      newBillButton.addEventListener("click", handleClickNewBill); // ajout de l'event au click
      fireEvent.click(newBillButton); // simulation de click
      expect(handleClickNewBill).toHaveBeenCalled(); // check que la fonction a été appelée
      expect(window.location.hash).toBe(ROUTES_PATH.NewBill); // vérification que l'URL actuelle est celle de la page NewBill donc bonne redirection
    });
    test("Then clicking on an eye icon should display the bill modal", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // identifié comme employé
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      // construction du DOM et navigation vers la page des bills
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // affichage des bills dans l'interface
      document.body.innerHTML = BillsUI({ data: bills });
      // attendre que le bouton soit disponible
      await waitFor(() => screen.getAllByTestId("icon-eye")[0]);

      // nouvelle instance de Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      $.fn.modal = jest.fn();

      // ajout d'une modale fictive au DOM
      const modale = document.createElement("div");
      modale.setAttribute("id", "modaleFile");
      modale.classList.add("modal", "show");
      document.body.append(modale);

      // récupération de la première icon eye
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      // récupération de handleClickIconEye
      const handleClickIconEye = jest.fn((icon) =>
        billsContainer.handleClickIconEye(icon)
      );
      // ajout d'un event au click
      eyeIcon.addEventListener("click", handleClickIconEye(eyeIcon));
      // simulation du click
      fireEvent.click(eyeIcon);

      // vérification que handleClickIconEye a été appelée
      expect(handleClickIconEye).toHaveBeenCalled();

      // vérification que la modale est affichée
      expect(modale.classList.contains("show")).toBeTruthy();
    });
    test("Then it should fetch bills from the store and format them", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Identifié comme employé
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Mock du store pour simuler des factures
      mockStore.bills = jest.fn(() => ({
        list: jest.fn().mockResolvedValue(bills), // Renvoie une promesse résolue
      }));

      // Création de l'instance Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Appel à getBills
      const fetchedBills = await billsContainer.getBills();

      // Données attendues formatées
      const formattedBills = bills.map((bill) => ({
        ...bill,
        date: formatDate(bill.date), // Appliquer le formatage de la date
        status: formatStatus(bill.status), // Appliquer le formatage du statut
      }));

      expect(fetchedBills).toEqual(formattedBills);
    });
  });
});
