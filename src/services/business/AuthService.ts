import bcrypt from "bcryptjs";
import {
  User,
  Role,
  ITokenizedUser,
  Monitor,
  Check,
} from "../../db/models/index.js";
const DEFAULT_ROLES = [
  {
    name: "SuperAdmin",
    description: "Super admin with all permissions",
    permissions: ["*"],
    isSystem: true,
  },
  {
    name: "Admin",
    description: "Admin with full permissions",
    permissions: ["monitor.*", "users.*"],
    isSystem: true,
  },
  {
    name: "Manager",
    description: "Can manage users",
    permissions: ["users.create", "users.update", "monitors.*"],
    isSystem: true,
  },
  {
    name: "Member",
    description: "Basic team member",
    permissions: [
      "users.update",
      "monitors.create",
      "monitors.view",
      "monitors.update",
    ],
    isSystem: true,
  },
];

export type RegisterData = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResult = ITokenizedUser;

class AuthService {
  async register(signupData: RegisterData): Promise<ITokenizedUser> {
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      throw new Error("Registration is closed. Please request an invite.");
    }

    const { email, firstName, lastName, password } = signupData;

    // Create all default roles
    const rolePromises = DEFAULT_ROLES.map((roleData) =>
      new Role({
        ...roleData,
      }).save()
    );
    const roles = await Promise.all(rolePromises);

    // Hash password and create user
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Find admin role and assign to first user
    const superAdminRole = roles.find((role) => role.name === "SuperAdmin");

    const user = new User({
      email,
      firstName,
      lastName,
      passwordHash,
      roles: [superAdminRole!._id],
    });

    const savedUser = await user.save();

    return {
      sub: savedUser._id.toString(),
      roles: savedUser.roles.map((role) => role.toString()),
    };
  }

  async login(loginData: LoginData): Promise<ITokenizedUser> {
    const { email, password } = loginData;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    return {
      sub: user._id.toString(),
      roles: user.roles.map((role) => role.toString()),
    };
  }

  async cleanup() {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Monitor.deleteMany({});
    await Check.deleteMany({});
  }

  async cleanMonitors() {
    await Monitor.deleteMany({});
    await Check.deleteMany({});
  }
}

export default AuthService;
