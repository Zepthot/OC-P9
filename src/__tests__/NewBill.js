/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom';
import NewBillUI from '../views/NewBillUI';
import NewBill from '../containers/NewBill';
import mockStore from '../__mocks__/store';
import { localStorageMock } from '../__mocks__/localStorage';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';

jest.mock('../app/store', () => mockStore);

describe('Given I am connected as an employee', () => {
  describe('When I upload a file on NewBill Page', () => {
    test('Then it should accept valid file formats and store file information', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'employee@test.tld',
        })
      );

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      await waitFor(() => screen.getByTestId('file'));
      const fileInput = screen.getByTestId('file');

      const billsMock = mockStore.bills();
      jest.spyOn(billsMock, 'create').mockImplementation(() =>
        Promise.resolve({
          fileUrl: 'https://localhost:3456/images/test.jpg',
          key: '1234',
        })
      );

      const validFile = new File(['image'], 'image.jpg', {
        type: 'image/jpeg',
      });
      const handleChangeFile = jest.fn(newBill.handleChangeFile.bind(newBill));
      fileInput.addEventListener('change', handleChangeFile);

      Object.defineProperty(fileInput, 'value', {
        value: 'C:\\fakepath\\image.jpg',
        writable: true,
      });
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => expect(mockStore.bills().create).toHaveBeenCalled());

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe('image.jpg');
      expect(newBill.fileName).toBe('image.jpg');
      expect(newBill.fileUrl).toBe('https://localhost:3456/images/test.jpg');
    });
    test('Then it should reset input if file format is invalid', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'employee@test.tld',
        })
      );
      document.body.innerHTML = NewBillUI();
      new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      await waitFor(() => screen.getByTestId('file'));
      const fileInput = screen.getByTestId('file');
      const alertMock = jest
        .spyOn(window, 'alert')
        .mockImplementation(() => {});

      const billsMock = mockStore.bills();
      jest.spyOn(billsMock, 'create').mockImplementation(() =>
        Promise.resolve({
          fileUrl: 'https://localhost:3456/images/test.jpg',
          key: '1234',
        })
      );

      // Test invalid file type
      const invalidFile = new File(['invalid content'], 'test.pdf', {
        type: 'application/pdf',
      });
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(alertMock).toHaveBeenCalledWith(
        'Veuillez sélectionner un fichier image au format jpg, jpeg ou png.'
      );
      expect(fileInput.value).toBe('');
    });
  });
  describe('When I submit a new bill form', () => {
    test('Then it should store the bill, and navigate to Bills page', async () => {
      const onNavigate = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'employee@test.tld' })
      );

      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const updateBill = jest.fn();
      newBill.updateBill = updateBill;

      fireEvent.change(screen.getByTestId('expense-name'), {
        target: { value: 'Test expense' },
      });
      fireEvent.change(screen.getByTestId('expense-type'), {
        target: { value: 'Transports' },
      });
      fireEvent.change(screen.getByTestId('amount'), {
        target: { value: '200' },
      });
      fireEvent.change(screen.getByTestId('datepicker'), {
        target: { value: '2024-06-01' },
      });
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '20' } });
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '10' } });
      fireEvent.change(screen.getByTestId('commentary'), {
        target: { value: 'Test commentary' },
      });

      const handleSubmitSpy = jest
        .spyOn(newBill, 'handleSubmit')
        .mockImplementation((e) => {
          e.preventDefault();
          newBill.updateBill({
            email: 'employee@test.tld',
            type: 'Transports',
            name: 'Test expense',
            amount: 200,
            date: '2024-06-01',
            vat: '20',
            pct: 10,
            commentary: 'Test commentary',
            fileUrl: 'https://localhost:3456/images/test.jpg',
            fileName: 'test.jpg',
            status: 'pending',
          });
        });

      const form = screen.getByTestId('form-new-bill');
      form.addEventListener('submit', newBill.handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmitSpy).toHaveBeenCalled();
      expect(updateBill).toHaveBeenCalledWith({
        email: 'employee@test.tld',
        type: 'Transports',
        name: 'Test expense',
        amount: 200,
        date: '2024-06-01',
        vat: '20',
        pct: 10,
        commentary: 'Test commentary',
        fileUrl: 'https://localhost:3456/images/test.jpg',
        fileName: 'test.jpg',
        status: 'pending',
      });

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  });
});
