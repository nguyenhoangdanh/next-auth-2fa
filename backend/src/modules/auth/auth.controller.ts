import e, {Request, Response} from 'express';
import {asyncHandler} from '../../middlewares/asyncHandler';
import {AuthService} from './auth.service';
import {HTTPSTATUS} from '../../config/http.config';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationEmailSchema,
} from '../../common/validators/auth.validator';
import {
  clearAuthenticaionCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticaionCookies,
} from '../../common/utils/cookie';
import {UnauthorizedException} from '../../common/utils/catch-error';
import { ErrorCode } from '../../common/enums/error-code.enum';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = registerSchema.parse({
        ...req.body,
      });
      const {user} = await this.authService.register(body);
      return res.status(HTTPSTATUS.CREATED).json({
        message: 'User registered successfully',
        data: user,
      });
    },
  );
  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.headers['user-agent'];

      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      });

      const {user, accessToken, refreshToken, mfaRequired} =
        await this.authService.login(body);

      return setAuthenticaionCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: 'User logged in successfully',
          user,
          mfaRequired,
        });
    },
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const refreshToken = req.cookies.refreshToken as string | undefined;
      const userAgent = req.headers['user-agent'];
      console.log('Received refreshToken:', refreshToken); // Debug log

      if (!refreshToken) {
        throw new UnauthorizedException('Missing refresh token');
      }

      const {accessToken, newRefreshToken} =
        await this.authService.refreshToken(refreshToken);

      if (newRefreshToken) {
        res.cookie(
          'refreshToken',
          newRefreshToken,
          getRefreshTokenCookieOptions(),
        );
      }

      return res
        .status(HTTPSTATUS.OK)
        .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
        .json({
          message: 'Refresh access token successfully',
        });
    },
  );

  public verifyEmail  = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
    const { code } = verificationEmailSchema.parse(req.body);
    await this.authService.verifyEmail(code);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Email verified successfully',
    });
    },
  )

  public forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email);
      await this.authService.forgotPassword(email);
      return res.status(HTTPSTATUS.OK).json({
        message: 'Password reset email sent successfully',
      });
    },
  );

  public resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = resetPasswordSchema.parse(req.body);
      await this.authService.resetPassword(body);

      return clearAuthenticaionCookies(res)
        .status(HTTPSTATUS.OK)
        .json({
          message: 'Password reset successfully',
        });
    },
  );
}
