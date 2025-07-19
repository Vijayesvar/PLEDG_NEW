import { Request, Response } from 'express';
import Joi from 'joi';
import { fetchMarketPrice } from '../utils/marketPrice';
import { LTV_THRESHOLD, MIN_LOAN_DURATION, MAX_LOAN_DURATION, MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT, MIN_INTEREST_RATE, MAX_INTEREST_RATE, MIN_COLLATERAL_AMOUNT, MAX_COLLATERAL_AMOUNT, SUPPORTED_COLLATERALS } from '../constants/loan';

export async function validateCreateLoan(req: Request, res: Response, next: Function) {
    try {
        const schema = Joi.object({
            collateral: Joi.string().required().valid(...SUPPORTED_COLLATERALS),
            collateralAmount: Joi.number().required().min(MIN_COLLATERAL_AMOUNT).max(MAX_COLLATERAL_AMOUNT),
            loanAmount: Joi.number().required().min(MIN_LOAN_AMOUNT).max(MAX_LOAN_AMOUNT),
            loanDuration: Joi.number().required().min(MIN_LOAN_DURATION).max(MAX_LOAN_DURATION).integer(),
            interestRate: Joi.number().required().min(MIN_INTEREST_RATE).max(MAX_INTEREST_RATE)
        });

        const { error } = schema.validate(req.body);
        if (error) {
            res.status(400).json({ error: "Invalid input" })
            return;
        }

        const inrPrice = await fetchMarketPrice({ collateral: req.body.collateral });
        const loanAmountInr = req.body.loanAmount * inrPrice;

        if (loanAmountInr > req.body.collateralAmount) {
            res.status(400).json({ error: "Insufficient collateral" });
            return;
        }

        const collateralInINR = await fetchMarketPrice({ collateral: req.body.collateral });

        const ltv = (loanAmountInr / collateralInINR) * 100;

        if (ltv > LTV_THRESHOLD) {
            res.status(400).json({ error: "Loan amount is too high" });
            return;
        }

        next();

    } catch (error) {
        console.error('Error validating loan application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}