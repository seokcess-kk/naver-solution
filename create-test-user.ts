import 'reflect-metadata';
import { AppDataSource } from './src/infrastructure/database/data-source';
import * as bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository('User');

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('ℹ️  Test user already exists');
      console.log('User ID:', existingUser.id);
      console.log('Email:', existingUser.email);
      await AppDataSource.destroy();
      return;
    }

    // Create new test user
    const hashedPassword = await bcrypt.hash('test123', 10);

    const newUser = userRepository.create({
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
    });

    await userRepository.save(newUser);

    console.log('✅ Test user created successfully!');
    console.log('User ID:', newUser.id);
    console.log('Email:', newUser.email);
    console.log('Password: test123');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
