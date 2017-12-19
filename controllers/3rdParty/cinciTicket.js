import uuidv1 from 'uuid/v4';

class CincyTicket {
  deactivateTicket(barcode) {
    return true;
  }

  issueTicket() {
    return {
      price: 1000,
      barcode: uuidv1()
    }
  }
}

export default CincyTicket;
