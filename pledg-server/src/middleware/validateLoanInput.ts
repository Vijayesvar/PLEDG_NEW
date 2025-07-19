import { Request, Response, NextFunction } from 'express';

export const validateLoanInput = (req: Request, res: Response, next: NextFunction): void => {
  const { loanAmountInr, interestRate, ltv, durationInDays, collateralToken, collateralAmount, borrowerId } = req.body;

  const errors: string[] = [];

  if (!loanAmountInr) errors.push('loanAmountInr is required');
  if (!interestRate) errors.push('interestRate is required');
  if (!ltv) errors.push('ltv is required');
  if (!durationInDays) errors.push('durationInDays is required');
  if (!collateralToken) errors.push('collateralToken is required');
  if (!collateralAmount) errors.push('collateralAmount is required');
  if (!borrowerId) errors.push('borrowerId is required');

  if (errors.length > 0) {
    res.status(400).json({ 
      message: 'Validation failed', 
      errors 
    });
    return;
  }

  if (collateralToken !== 'eth') {
    res.status(400).json({ 
      message: 'Only eth collateral is currently supported' 
    });
    return;
  }

  if (durationInDays <= 0) {
    res.status(400).json({ 
      message: 'durationInDays must be greater than 0' 
    });
    return;
  }

  if (parseFloat(interestRate) <= 0 || parseFloat(interestRate) > 100) {
    res.status(400).json({ 
      message: 'interestRate must be between 0 and 100' 
    });
    return;
  }

  if (parseFloat(ltv) <= 0 || parseFloat(ltv) > 100) {
    res.status(400).json({ 
      message: 'ltv must be between 0 and 100' 
    });
    return;
  }

  next();
}; 